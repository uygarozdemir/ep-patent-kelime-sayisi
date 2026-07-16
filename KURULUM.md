# Kurulum

Bu bir Chrome eklentisidir, Chrome Web Store'da yayınlanmamıştır. "Paketlenmemiş öğe"
(unpacked extension) olarak elle yüklenir. Kurulum tek seferlik yapılır.

## Adımlar

1. Chrome'da adres çubuğuna şunu yaz ve Enter'a bas:
   ```
   chrome://extensions
   ```

2. Sayfanın **sağ üst köşesinde** bulunan **"Geliştirici modu"** (Developer mode)
   anahtarını aç. (Kapalıysa "Paketlenmemiş öğe yükle" butonu görünmez.)

3. Sol üstte beliren **"Paketlenmemiş öğe yükle"** (Load unpacked) butonuna tıkla.

4. Açılan pencerede bu proje klasörünü (bu dosyanın da içinde bulunduğu klasörü) seç.
   (Klasörün kendisini seçmen yeterli, içindeki dosyaları tek tek seçmene gerek yok.)

5. Eklenti listede **"EP Patent B1 Kelime Sayısı"** adıyla görünür ve otomatik aktif olur.

## Eklenti ikonunu araç çubuğuna sabitleme (opsiyonel ama önerilir)

Chrome'un sağ üstündeki **puzzle parçası (uzantılar)** ikonuna tıkla, listede
"EP Patent B1 Kelime Sayısı"nı bul, yanındaki **pinleme (raptiye)** ikonuna tıkla. Böylece
eklenti her seferinde puzzle menüsüne girmeden, doğrudan araç çubuğundan tek tıkla açılır.

## Kullanım

1. Araç çubuğundaki eklenti ikonuna tıkla.
2. Açılan küçük pencereye patent numarasını yaz — `EP 3634453`, `EP3634453` veya
   `3634453` gibi formatların hepsi çalışır.
3. **"Ara"** butonuna bas (ya da Enter'a bas).
4. Birkaç saniye içinde B1 yayınının Tarifname + İstemler kelime sayısı ekranda görünür.

## Güncelleme yapıldığında

Kod dosyalarında (`popup.js`, `popup.html`, `manifest.json`, `rules.json`) bir değişiklik
olursa, tekrar "Paketlenmemiş öğe yükle" yapmana gerek yok:

1. `chrome://extensions` sayfasını aç.
2. Eklentinin kartındaki **yenile (döngü ok)** ikonuna tıkla.

## Sorun Giderme

- **"Hata: Arama isteği başarısız (403)"** — Eklenti güncel değil veya yanlış klasörden
  yüklenmiş olabilir. `chrome://extensions`'ta eklentiyi yenile; sorun devam ederse
  eklentiyi kaldırıp bu klasörden yeniden yükle.
- **"Bu numara için B1 yayını bulunamadı"** — Girilen numaranın B1 (patent tescili) aşamasına
  henüz ulaşmamış olma ihtimali var; EPO'nun kendi arama sayfasından
  (https://data.epo.org/publication-server/) manuel kontrol edilebilir.
- **Popup hiç açılmıyor / boş görünüyor** — Eklenti simgesine sağ tıklayıp
  "İncele" (Inspect popup) ile Chrome DevTools konsolunda hata mesajına bakılabilir.
