# EP Patent B1 Kelime Sayısı

Bir EP patent numarası verildiğinde, EPO (Avrupa Patent Ofisi) Yayın Sunucusu'nda **B1**
(patent tescili) yayınını otomatik olarak bulan ve **Tarifname (description) + İstemler
(claims)** için MS Word'e uyumlu bir kelime sayısı hesaplayan Chrome uzantısı.

Çeviri işi yapanlar için: fiyat teklifi verirken veya iş yükünü ölçerken Word'de tek tek
sayım yapmaya gerek kalmadan, patent numarasını yazıp saniyeler içinde doğru kelime sayısına
ulaşmayı sağlar.

## Ne yapar?

1. Girilen patent numarasını (`EP 3634453`, `EP3634453` veya `3634453` — hepsi kabul edilir)
   alır.
2. EPO Yayın Sunucusu'nda bu numaranın **B1** yayınını arar.
3. Bulunan yayının XML dosyasını indirir.
4. XML içinden yalnızca **Tarifname** ve **prosedür dilindeki İstemler** metnini ayıklar
   (patent üç dilde istem içerebilir — sadece işlem dilindeki istem sayılır; bibliyografik
   veriler ve atıf listeleri hariç tutulur).
5. MS Word'ün kelime sayma mantığına uyumlu bir tokenizer ile kelimeleri sayar (em-dash/en-dash
   ayraç, tire birleştirici, saf noktalama tokenları hariç).
6. Sonucu popup'ta gösterir.

## Kurulum

Bu uzantı Chrome Web Store'da yayınlanmamıştır, "paketlenmemiş öğe" (unpacked extension)
olarak elle yüklenir. Adım adım kurulum için [KURULUM.md](KURULUM.md) dosyasına bakın.

Kısaca:

1. `chrome://extensions` adresine git, **Geliştirici modu**'nu aç.
2. **Paketlenmemiş öğe yükle** ile bu klasörü seç.
3. Eklenti ikonuna tıkla, patent numarasını yaz, **Ara**'ya bas.

## Nasıl çalışıyor? (mimari)

Uzantının hiçbir arka plan servisi (background service worker) yok; her şey `popup.js`
içinde, popup açıkken çalışan doğrudan `fetch` istekleriyle yürütülüyor.

**1. İki adımlı EPO API akışı**

EPO'nun "numaraya göre B1 getir" diye tek bir endpoint'i yok; `data.epo.org` üzerindeki
React uygulamasının kullandığı akış birebir taklit ediliyor:

- **Arama** — `POST /publication-server/publications` ile patent numarası (yalnızca
  rakamlar) ve `publicationKinds: ["B1"]` filtresiyle arama yapılır; yanıt, tam XML dosya
  yolunu (`xmlFile`) verir.
- **XML indirme** — `GET /publication-server/publications/xml?path=<xmlFile>` ile ham
  `ep-patent-document` XML'i indirilir.

**2. Cloudflare `Origin` kontrolü → `rules.json`**

`data.epo.org` Cloudflare arkasında olduğu için `Origin` header'ı `https://data.epo.org`
olmayan istekleri reddediyor. Bir uzantı popup'ından atılan `fetch`, tarayıcı tarafından
`Origin: chrome-extension://<id>` gönderir ve **403** alır. `Origin`/`Referer` JS'ten
doğrudan değiştirilemeyen (forbidden) header'lar olduğundan, bu sorun ağ katmanında
`declarativeNetRequest` kuralları (`rules.json`) ile çözülüyor: EPO'ya giden isteklerin
`Origin`/`Referer`'ı EPO'nun kendi origin'i olacak şekilde yeniden yazılıyor.

**3. Kelime sayma mantığı**

`description` + prosedür dilindeki `claims` elementlerinin `textContent`'i alınıp, MS
Word'ün gerçek davranışına göre kalibre edilmiş bir tokenizer ile sayılıyor (detaylar için
[CLAUDE.md](CLAUDE.md)).

## Dosyalar

| Dosya | Görev |
|---|---|
| `manifest.json` | Uzantı tanımı (Manifest V3), izinler, ikonlar |
| `popup.html` / `popup.js` | Arayüz ve tüm iş mantığı (arama, indirme, sayma) |
| `rules.json` | Cloudflare 403 sorununu çözen `declarativeNetRequest` kuralları |
| `KURULUM.md` | Adım adım kurulum talimatı |

## Teknoloji

Sıfır bağımlılık, sıfır build adımı. Sadece vanilla JavaScript + Chrome Extension API'leri
(Manifest V3). Paket yöneticisi yok, bundler yok, test framework'ü yok — tüm kod doğrudan
paketlenmemiş uzantı kaynağı olarak çalışır.

## Lisans

Bu proje kişisel kullanım için geliştirilmiştir.
