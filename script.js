// DOM Elementleri
const bitSizeSelect = document.getElementById("bitSize");
const inputDataField = document.getElementById("inputData");
const encodeBtn = document.getElementById("encodeBtn");
const injectErrorBtn = document.getElementById("injectErrorBtn");
const detectErrorBtn = document.getElementById("detectErrorBtn");
const errorBitPosition = document.getElementById("errorBitPosition");
const validationMessage = document.getElementById("validationMessage");
const errorMessage = document.getElementById("errorMessage");
const encodedDataDisplay = document.getElementById("encodedDataDisplay");
const errorDataDisplay = document.getElementById("errorDataDisplay");
const correctedDataDisplay = document.getElementById("correctedDataDisplay");

// Sonuç Containerları
const encodedResult = document.getElementById("encodedResult");
const errorResult = document.getElementById("errorResult");
const correctionResult = document.getElementById("correctionResult");

// Global Değişkenler
let originalData = "";
let encodedData = "";
let errorData = "";
let correctedData = "";
let totalBits = 0;
let dataBits = 0;
let parityBits = 0;

// Event Listeners
encodeBtn.addEventListener("click", validateAndEncode);
injectErrorBtn.addEventListener("click", injectError);
detectErrorBtn.addEventListener("click", detectAndCorrectError);
bitSizeSelect.addEventListener("change", updatePlaceholder);

// Veri boyutuna göre placeholder güncelleme
function updatePlaceholder() {
  const bitSize = parseInt(bitSizeSelect.value);
  inputDataField.placeholder = `${bitSize} bit ikili sayı girin`;
  inputDataField.maxLength = bitSize;

  // Varsa önceki sonuçları temizle
  validationMessage.textContent = "";
  validationMessage.className = "message";

  encodedResult.style.display = "none";
  errorResult.style.display = "none";
  correctionResult.style.display = "none";

  // Hata enjeksiyon butonunu devre dışı bırak
  injectErrorBtn.disabled = true;
  detectErrorBtn.disabled = true;
}

// Sayfa yüklendiğinde placeholder'ı ayarla
updatePlaceholder();

// Veriyi doğrula ve Hamming kodunu hesapla
function validateAndEncode() {
  // Önce veriyi doğrula
  const bitSize = parseInt(bitSizeSelect.value);
  const inputData = inputDataField.value.trim();

  // Boş giriş kontrolü
  if (inputData === "") {
    showMessage(validationMessage, "Lütfen veri girişi yapın.", "error");
    injectErrorBtn.disabled = true;
    return;
  }

  // Binary giriş kontrolü
  if (!/^[01]+$/.test(inputData)) {
    showMessage(
      validationMessage,
      "Lütfen sadece 0 ve 1 değerlerini kullanın.",
      "error"
    );
    injectErrorBtn.disabled = true;
    return;
  }

  // Bit boyutu kontrolü
  if (inputData.length !== bitSize) {
    showMessage(
      validationMessage,
      `Lütfen tam olarak ${bitSize} bit girin.`,
      "error"
    );
    injectErrorBtn.disabled = true;
    return;
  }

  // Veri geçerli, orijinal veriyi kaydet
  originalData = inputData;

  // Hamming kodunu hesapla
  encodeData();

  // Başarı mesajı göster
  showMessage(
    validationMessage,
    "Hamming kodu başarıyla hesaplandı!",
    "success"
  );
}

// Hamming SEC-DED kodunu hesapla
function encodeData() {
  dataBits = parseInt(bitSizeSelect.value);

  // Gerekli parite biti sayısını hesapla (r)
  // 2^r >= m+r+1 formülünü çöz (m: veri biti sayısı, r: parite biti sayısı)
  let r = 0;
  while (Math.pow(2, r) < dataBits + r + 1) {
    r++;
  }

  parityBits = r;
  totalBits = dataBits + parityBits + 1; // +1 genel parite biti için (DED)

  // Parite ve veri bitlerini yerleştir
  let encodedArr = new Array(totalBits).fill(null);

  // Genel parite biti (0. pozisyon)
  encodedArr[0] = 0;

  // Parite bitleri (2^n pozisyonlarda)
  for (let i = 0; i < parityBits; i++) {
    const position = Math.pow(2, i);
    encodedArr[position] = 0;
  }

  // Veri bitlerini yerleştir
  let dataIndex = 0;
  for (let i = 1; i < totalBits; i++) {
    // Parite biti pozisyonu değilse
    if ((i & (i - 1)) !== 0 && i !== 0) {
      // i bir 2'nin kuvveti değilse
      encodedArr[i] = parseInt(originalData[dataIndex]);
      dataIndex++;

      if (dataIndex >= originalData.length) break;
    }
  }

  // Parite bitlerini hesapla
  for (let i = 0; i < parityBits; i++) {
    const parityPos = Math.pow(2, i);
    let parityValue = 0;

    // Bu parite bitinin kontrol ettiği tüm pozisyonlar için
    for (let j = 1; j < totalBits; j++) {
      if ((j & parityPos) !== 0 && encodedArr[j] !== null) {
        parityValue ^= encodedArr[j]; // XOR işlemi
      }
    }

    encodedArr[parityPos] = parityValue;
  }

  // Genel parite bitini hesapla (Tüm diğer bitlerin XOR'u)
  let overallParity = 0;
  for (let i = 1; i < totalBits; i++) {
    if (encodedArr[i] !== null) {
      overallParity ^= encodedArr[i];
    }
  }
  encodedArr[0] = overallParity;

  // Null değerleri temizle (olması durumunda)
  encodedData = encodedArr.filter((bit) => bit !== null).join("");

  // Kodlanmış veriyi görüntüle
  displayEncodedData(encodedArr);

  // Hata enjeksiyon butonunu etkinleştir
  injectErrorBtn.disabled = false;

  // Hata konum girişini güncelle
  errorBitPosition.max = totalBits;
  document.getElementById("secondErrorBitPosition").max = totalBits;

  // Sonuç bölümünü göster
  encodedResult.style.display = "block";
  errorResult.style.display = "none";
  correctionResult.style.display = "none";
}

// Kodlanmış veriyi ekranda göster
function displayEncodedData(encodedArr) {
  encodedDataDisplay.innerHTML = "";

  for (let i = 0; i < encodedArr.length; i++) {
    if (encodedArr[i] === null) continue;

    const bitElement = document.createElement("div");
    bitElement.classList.add("bit");
    bitElement.textContent = encodedArr[i];

    // Bit pozisyonunu 1 tabanında ve tersten göster
    const displayPosition = totalBits - i;
    bitElement.setAttribute("data-position", displayPosition);

    // Bit tipine göre sınıf ekle
    if (i === 0) {
      bitElement.classList.add("overall-parity");
    } else if ((i & (i - 1)) === 0) {
      // i 2'nin kuvveti ise
      bitElement.classList.add("parity-bit");
    } else {
      bitElement.classList.add("data-bit");
    }

    encodedDataDisplay.appendChild(bitElement);
  }
}

// Veri içine hata enjekte et
function injectError() {
  if (!encodedData) return;

  const userPosition = parseInt(errorBitPosition.value);
  const position = totalBits - userPosition;

  if (position < 0 || position >= totalBits) {
    alert(`Lütfen 1 ile ${totalBits} arasında bir bit pozisyonu girin.`);
    return;
  }

  // Hata enjekte et (bit değerini tersine çevir)
  let errorArr = encodedData.split("").map((bit) => parseInt(bit));
  errorArr[position] = errorArr[position] === 0 ? 1 : 0;

  // İkinci hata biti (DED için)
  const secondErrorPosition = document.getElementById("secondErrorBitPosition");
  let secondPos = -1;

  if (secondErrorPosition && secondErrorPosition.value) {
    const userSecondPos = parseInt(secondErrorPosition.value);
    secondPos = totalBits - userSecondPos;
    if (secondPos >= 0 && secondPos < totalBits && secondPos !== position) {
      errorArr[secondPos] = errorArr[secondPos] === 0 ? 1 : 0;
      displayErrorData(errorArr, position, secondPos);
    } else {
      secondPos = -1;
      displayErrorData(errorArr, position);
    }
  } else {
    displayErrorData(errorArr, position);
  }

  errorData = errorArr.join("");

  // Hata tespit butonunu etkinleştir
  detectErrorBtn.disabled = false;

  // Sonuç bölümünü göster
  errorResult.style.display = "block";
  correctionResult.style.display = "none";
}

// Hatalı veriyi ekranda göster
function displayErrorData(errorArr, errorPosition, secondErrorPosition = null) {
  errorDataDisplay.innerHTML = "";

  for (let i = 0; i < errorArr.length; i++) {
    const bitElement = document.createElement("div");
    bitElement.classList.add("bit");
    bitElement.textContent = errorArr[i];

    // Bit pozisyonunu 1 tabanında ve tersten göster
    const displayPosition = totalBits - i;
    bitElement.setAttribute("data-position", displayPosition);

    // Bit tipine göre sınıf ekle
    if (i === 0) {
      bitElement.classList.add("overall-parity");
    } else if ((i & (i - 1)) === 0) {
      // i 2'nin kuvveti ise
      bitElement.classList.add("parity-bit");
    } else {
      bitElement.classList.add("data-bit");
    }

    // Hatalı biti işaretle
    if (i === errorPosition || i === secondErrorPosition) {
      bitElement.classList.add("error-bit");
    }

    errorDataDisplay.appendChild(bitElement);
  }
}

// Hatayı tespit et ve düzelt
function detectAndCorrectError() {
  if (!errorData) return;

  const errorArr = errorData.split("").map((bit) => parseInt(bit));
  let correctedArr = [...errorArr];

  // İlk önce genel parite kontrolü yap (Çift hata tespiti için)
  let calculatedOverallParity = 0;
  for (let i = 1; i < totalBits; i++) {
    calculatedOverallParity ^= errorArr[i];
  }

  // Parite biti eşleşiyor mu kontrol et
  const overallParityMatch = calculatedOverallParity === errorArr[0];

  // Sendrom kelimesini hesapla
  let syndrome = 0;
  for (let i = 0; i < parityBits; i++) {
    const parityPos = Math.pow(2, i);
    let parityCheck = 0;

    for (let j = 1; j < totalBits; j++) {
      if ((j & parityPos) !== 0) {
        parityCheck ^= errorArr[j];
      }
    }

    // Parite biti uyuşmuyorsa sendroma ekle
    if (parityCheck !== 0) {
      syndrome += parityPos;
    }
  }

  // Hata analizi
  let errorPosition = -1;
  let errorMessageText = "";

  // 1. Sendrom 0 ve genel parite eşleşiyorsa - hata yok
  if (syndrome === 0 && overallParityMatch) {
    errorMessageText = "Hata tespit edilmedi. Veri doğru.";
  }
  // 2. Sendrom 0 ve genel parite eşleşmiyorsa - genel parite bitinde hata var
  else if (syndrome === 0 && !overallParityMatch) {
    errorMessageText = `${totalBits}. pozisyonda (genel parite biti) hata tespit edildi ve düzeltildi.`;
    errorPosition = 0;
    correctedArr[0] = correctedArr[0] === 0 ? 1 : 0;
  }
  // 3. Sendrom 0 değil ve genel parite eşleşmiyorsa - tek bit hatası
  else if (syndrome !== 0 && !overallParityMatch) {
    const displayPosition = totalBits - syndrome;
    errorMessageText = `${displayPosition}. pozisyonda tek bit hatası tespit edildi ve düzeltildi.`;
    errorPosition = syndrome;
    correctedArr[syndrome] = correctedArr[syndrome] === 0 ? 1 : 0;
  }
  // 4. Sendrom 0 değil ve genel parite eşleşiyorsa - çift bit hatası
  else if (syndrome !== 0 && overallParityMatch) {
    errorMessageText = "Çift bit hatası tespit edildi. Düzeltilemiyor.";
  }

  // Düzeltilmiş veriyi görüntüle
  displayCorrectedData(correctedArr, errorPosition);

  // Hata mesajını göster
  errorMessage.textContent = errorMessageText;

  // Sonuç bölümünü göster
  correctionResult.style.display = "block";
}

// Düzeltilmiş veriyi ekranda göster
function displayCorrectedData(correctedArr, correctedPosition) {
  correctedDataDisplay.innerHTML = "";

  for (let i = 0; i < correctedArr.length; i++) {
    const bitElement = document.createElement("div");
    bitElement.classList.add("bit");
    bitElement.textContent = correctedArr[i];

    // Bit pozisyonunu 1 tabanında ve tersten göster
    const displayPosition = totalBits - i;
    bitElement.setAttribute("data-position", displayPosition);

    // Bit tipine göre sınıf ekle
    if (i === 0) {
      bitElement.classList.add("overall-parity");
    } else if ((i & (i - 1)) === 0) {
      // i 2'nin kuvveti ise
      bitElement.classList.add("parity-bit");
    } else {
      bitElement.classList.add("data-bit");
    }

    // Düzeltilmiş biti işaretle
    if (correctedPosition !== 0 && i === correctedPosition) {
      bitElement.classList.add("corrected-bit");
    } else if (correctedPosition === 0 && i === 0) {
      bitElement.classList.add("corrected-bit");
    }

    correctedDataDisplay.appendChild(bitElement);
  }
}

function showMessage(element, message, type) {
  element.textContent = message;
  element.className = "message";

  if (type) {
    element.classList.add(type);
  }
}
