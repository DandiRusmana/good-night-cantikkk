import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

// ---- INISIALISASI SCENE, KAMERA, RENDERER ----
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.0015);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
camera.position.set(0, 20, 30);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('wadah').appendChild(renderer.domElement);

// ---- INISIALISASI KONTROL ----
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;
controls.enabled = false;
controls.target.set(0, 0, 0);
controls.enablePan = false;
controls.minDistance = 15;
controls.maxDistance = 300;
controls.zoomSpeed = 0.3;
controls.rotateSpeed = 0.3;
controls.update();

// ---- FUNGSI BANTUAN UNTUK MEMBUAT EFEK CAHAYA ----
function buatMaterialCahaya(warna, ukuran = 128, transparansi = 0.55) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = ukuran;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(ukuran / 2, ukuran / 2, 0, ukuran / 2, ukuran / 2, ukuran / 2);
    gradient.addColorStop(0, warna);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, ukuran, ukuran);

    const tekstur = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
        map: tekstur,
        transparent: true,
        opacity: transparansi,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    return new THREE.Sprite(material);
}

// ---- MEMBUAT KOMPONEN-KOMPONEN SCENE ----

// Cahaya pusat
const cahayaPusat = buatMaterialCahaya('rgba(255,255,255,0.8)', 156, 0.25);
cahayaPusat.scale.set(8, 8, 1);
scene.add(cahayaPusat);

// Awan nebula acak
for (let i = 0; i < 15; i++) {
    const hue = Math.random() * 360;
    const warna = `hsla(${hue}, 80%, 50%, 0.6)`;
    const nebula = buatMaterialCahaya(warna, 256);
    nebula.scale.set(100, 100, 1);
    nebula.position.set(
        (Math.random() - 0.5) * 175,
        (Math.random() - 0.5) * 175,
        (Math.random() - 0.5) * 175
    );
    scene.add(nebula);
}

// ---- MEMBUAT GALAKSI ----
const parameterGalaksi = {
    jumlah: 100000,
    lengan: 6,
    radius: 100,
    putaran: 0.5,
    keacakan: 0.2,
    kekuatanAcak: 20,
    warnadalam: new THREE.Color(0xd63ed6),
    warnaLuar: new THREE.Color(0x48b8b8),
};

// TAMBAHKAN GAMBAR DI SINI
const gambarHati = [
    ...(window.dataLove2Loveloom && window.dataLove2Loveloom.data.heartImages ? window.dataLove2Loveloom.data.heartImages : []),
    './gambar/1.jpg', './gambar/2.jpg', './gambar/3.jpg', './gambar/4.jpg', './gambar/5.jpg', './gambar/6.jpg'
];

const pemuatTekstur = new THREE.TextureLoader();
const jumlahKelompok = gambarHati.length;

// --- LOGIKA MENGGUNAKAN INTERPOLASI ---

// Kepadatan titik ketika hanya ada 1 gambar (tertinggi)
const kepadatanMaks = 15000;
// Kepadatan titik ketika ada 10 gambar atau lebih (terendah)
const kepadatanMin = 4000;
// Jumlah gambar maksimal yang kita perhatikan untuk penyesuaian
const maksKelompokUntukSkala = 9;

let titikPerKelompok;

if (jumlahKelompok <= 1) {
    titikPerKelompok = kepadatanMaks;
} else if (jumlahKelompok >= maksKelompokUntukSkala) {
    titikPerKelompok = kepadatanMin;
} else {
    const t = (jumlahKelompok - 1) / (maksKelompokUntukSkala - 1);
    titikPerKelompok = Math.floor(kepadatanMaks * (1 - t) + kepadatanMin * t);
}

if (titikPerKelompok * jumlahKelompok > parameterGalaksi.jumlah) {
    titikPerKelompok = Math.floor(parameterGalaksi.jumlah / jumlahKelompok);
}

console.log(`Jumlah gambar: ${jumlahKelompok}, Titik per gambar: ${titikPerKelompok}`);

const posisi = new Float32Array(parameterGalaksi.jumlah * 3);
const warna = new Float32Array(parameterGalaksi.jumlah * 3);
let indeksTitik = 0;

for (let i = 0; i < parameterGalaksi.jumlah; i++) {
    const radius = Math.pow(Math.random(), parameterGalaksi.kekuatanAcak) * parameterGalaksi.radius;
    const sudutCabang = (i % parameterGalaksi.lengan) / parameterGalaksi.lengan * Math.PI * 2;
    const sudutPutar = radius * parameterGalaksi.putaran;

    const acakX = (Math.random() - 0.5) * parameterGalaksi.keacakan * radius;
    const acakY = (Math.random() - 0.5) * parameterGalaksi.keacakan * radius * 0.5;
    const acakZ = (Math.random() - 0.5) * parameterGalaksi.keacakan * radius;
    const sudutTotal = sudutCabang + sudutPutar;

    if (radius < 30 && Math.random() < 0.7) continue;

    const i3 = indeksTitik * 3;
    posisi[i3] = Math.cos(sudutTotal) * radius + acakX;
    posisi[i3 + 1] = acakY;
    posisi[i3 + 2] = Math.sin(sudutTotal) * radius + acakZ;

    const warnaCampur = new THREE.Color(0xff66ff);
    warnaCampur.lerp(new THREE.Color(0x66ffff), radius / parameterGalaksi.radius);
    warnaCampur.multiplyScalar(0.7 + 0.3 * Math.random());
    warna[i3] = warnaCampur.r;
    warna[i3 + 1] = warnaCampur.g;
    warna[i3 + 2] = warnaCampur.b;

    indeksTitik++;
}

const geometriGalaksi = new THREE.BufferGeometry();
geometriGalaksi.setAttribute('position', new THREE.BufferAttribute(posisi.slice(0, indeksTitik * 3), 3));
geometriGalaksi.setAttribute('color', new THREE.BufferAttribute(warna.slice(0, indeksTitik * 3), 3));

const materialGalaksi = new THREE.ShaderMaterial({
    uniforms: {
        uWaktu: { value: 0.0 },
        uUkuran: { value: 50.0 * renderer.getPixelRatio() },
        uWaktuRiak: { value: -1.0 },
        uKecepatanRiak: { value: 40.0 },
        uLebarRiak: { value: 20.0 }
    },
    vertexShader: `
        uniform float uUkuran;
        uniform float uWaktu;
        uniform float uWaktuRiak;
        uniform float uKecepatanRiak;
        uniform float uLebarRiak;

        varying vec3 vWarna;

        void main() {
            // Ambil warna asli dari geometri (sama seperti vertexColors: true)
            vWarna = color;

            vec4 posisiModel = modelMatrix * vec4(position, 1.0);

            // ---- LOGIKA EFEK GELOMBANG ----
            if (uWaktuRiak > 0.0) {
                float radiusRiak = (uWaktu - uWaktuRiak) * uKecepatanRiak;
                float jarakPartikel = length(posisiModel.xyz);

                float kekuatan = 1.0 - smoothstep(radiusRiak - uLebarRiak, radiusRiak + uLebarRiak, jarakPartikel);
                kekuatan *= smoothstep(radiusRiak + uLebarRiak, radiusRiak - uLebarRiak, jarakPartikel);

                if (kekuatan > 0.0) {
                    vWarna += vec3(kekuatan * 2.0); // Buat warna lebih cerah ketika gelombang lewat
                }
            }

            vec4 posisiView = viewMatrix * posisiModel;
            gl_Position = projectionMatrix * posisiView;
            // Baris ini membuat partikel lebih kecil ketika jauh, meniru perilaku PointsMaterial
            gl_PointSize = uUkuran / -posisiView.z;
        }
    `,
    fragmentShader: `
        varying vec3 vWarna;
        void main() {
            // Buat partikel berbentuk bulat alih-alih kotak
            float jarak = length(gl_PointCoord - vec2(0.5));
            if (jarak > 0.5) discard;

            gl_FragColor = vec4(vWarna, 1.0);
        }
    `,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    vertexColors: true
});
const galaksi = new THREE.Points(geometriGalaksi, materialGalaksi);
scene.add(galaksi);

function buatTeksturNeon(gambar, ukuran) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = ukuran;
    const ctx = canvas.getContext('2d');
    const rasioAspek = gambar.width / gambar.height;
    let lebarGambar, tinggiGambar, offsetX, offsetY;
    if (rasioAspek > 1) {
        lebarGambar = ukuran;
        tinggiGambar = ukuran / rasioAspek;
        offsetX = 0;
        offsetY = (ukuran - tinggiGambar) / 2;
    } else {
        tinggiGambar = ukuran;
        lebarGambar = ukuran * rasioAspek;
        offsetX = (ukuran - lebarGambar) / 2;
        offsetY = 0;
    }
    ctx.clearRect(0, 0, ukuran, ukuran);
    const radiusSudut = ukuran * 0.1;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(offsetX + radiusSudut, offsetY);
    ctx.lineTo(offsetX + lebarGambar - radiusSudut, offsetY);
    ctx.arcTo(offsetX + lebarGambar, offsetY, offsetX + lebarGambar, offsetY + radiusSudut, radiusSudut);
    ctx.lineTo(offsetX + lebarGambar, offsetY + tinggiGambar - radiusSudut);
    ctx.arcTo(offsetX + lebarGambar, offsetY + tinggiGambar, offsetX + lebarGambar - radiusSudut, offsetY + tinggiGambar, radiusSudut);
    ctx.lineTo(offsetX + radiusSudut, offsetY + tinggiGambar);
    ctx.arcTo(offsetX, offsetY + tinggiGambar, offsetX, offsetY + tinggiGambar - radiusSudut, radiusSudut);
    ctx.lineTo(offsetX, offsetY + radiusSudut);
    ctx.arcTo(offsetX, offsetY, offsetX + radiusSudut, offsetY, radiusSudut);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(gambar, offsetX, offsetY, lebarGambar, tinggiGambar);
    ctx.restore();
    return new THREE.CanvasTexture(canvas);
}

// ---- MEMBUAT KELOMPOK TITIK BERBENTUK HATI ----
for (let kelompok = 0; kelompok < jumlahKelompok; kelompok++) {
    const posisiKelompok = new Float32Array(titikPerKelompok * 3);
    const warnaKelompokDekat = new Float32Array(titikPerKelompok * 3);
    const warnaKelompokJauh = new Float32Array(titikPerKelompok * 3);
    let jumlahTitikValid = 0;

    for (let i = 0; i < titikPerKelompok; i++) {
        const idx = jumlahTitikValid * 3;
        const idxGlobal = kelompok * titikPerKelompok + i;
        const radius = Math.pow(Math.random(), parameterGalaksi.kekuatanAcak) * parameterGalaksi.radius;
        if (radius < 30) continue;

        const sudutCabang = (idxGlobal % parameterGalaksi.lengan) / parameterGalaksi.lengan * Math.PI * 2;
        const sudutPutar = radius * parameterGalaksi.putaran;

        const acakX = (Math.random() - 0.5) * parameterGalaksi.keacakan * radius;
        const acakY = (Math.random() - 0.5) * parameterGalaksi.keacakan * radius * 0.5;
        const acakZ = (Math.random() - 0.5) * parameterGalaksi.keacakan * radius;
        const sudutTotal = sudutCabang + sudutPutar;

        posisiKelompok[idx] = Math.cos(sudutTotal) * radius + acakX;
        posisiKelompok[idx + 1] = acakY;
        posisiKelompok[idx + 2] = Math.sin(sudutTotal) * radius + acakZ;

        const warnaDekat = new THREE.Color(0xffffff);
        warnaKelompokDekat[idx] = warnaDekat.r;
        warnaKelompokDekat[idx + 1] = warnaDekat.g;
        warnaKelompokDekat[idx + 2] = warnaDekat.b;

        const warnaJauh = parameterGalaksi.warnadalam.clone();
        warnaJauh.lerp(parameterGalaksi.warnaLuar, radius / parameterGalaksi.radius);
        warnaJauh.multiplyScalar(0.7 + 0.3 * Math.random());
        warnaKelompokJauh[idx] = warnaJauh.r;
        warnaKelompokJauh[idx + 1] = warnaJauh.g;
        warnaKelompokJauh[idx + 2] = warnaJauh.b;

        jumlahTitikValid++;
    }

    if (jumlahTitikValid === 0) continue;

    // Geometri untuk kondisi dekat kamera
    const geometriKelompokDekat = new THREE.BufferGeometry();
    geometriKelompokDekat.setAttribute('position', new THREE.BufferAttribute(posisiKelompok.slice(0, jumlahTitikValid * 3), 3));
    geometriKelompokDekat.setAttribute('color', new THREE.BufferAttribute(warnaKelompokDekat.slice(0, jumlahTitikValid * 3), 3));

    // Geometri untuk kondisi jauh dari kamera
    const geometriKelompokJauh = new THREE.BufferGeometry();
    geometriKelompokJauh.setAttribute('position', new THREE.BufferAttribute(posisiKelompok.slice(0, jumlahTitikValid * 3), 3));
    geometriKelompokJauh.setAttribute('color', new THREE.BufferAttribute(warnaKelompokJauh.slice(0, jumlahTitikValid * 3), 3));

    // Hitung pusat kelompok titik dan pindah ke koordinat asal
    const attrPos = geometriKelompokJauh.getAttribute('position');
    let cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < attrPos.count; i++) {
        cx += attrPos.getX(i);
        cy += attrPos.getY(i);
        cz += attrPos.getZ(i);
    }
    cx /= attrPos.count;
    cy /= attrPos.count;
    cz /= attrPos.count;
    geometriKelompokDekat.translate(-cx, -cy, -cz);
    geometriKelompokJauh.translate(-cx, -cy, -cz);

    // Muat gambar dan buat objek
    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.src = gambarHati[kelompok];
    img.onload = () => {
        const teksturNeon = buatTeksturNeon(img, 256);

        // Material ketika dekat
        const materialDekat = new THREE.PointsMaterial({
            size: 1.8,
            map: teksturNeon,
            transparent: false,
            alphaTest: 0.2,
            depthWrite: true,
            depthTest: true,
            blending: THREE.NormalBlending,
            vertexColors: true
        });

        // Material ketika jauh
        const materialJauh = new THREE.PointsMaterial({
            size: 1.8,
            map: teksturNeon,
            transparent: true,
            alphaTest: 0.2,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexColors: true
        });

        const objekTitik = new THREE.Points(geometriKelompokJauh, materialJauh);
        objekTitik.position.set(cx, cy, cz); // Kembalikan posisi awal dalam scene

        // Simpan kondisi untuk perubahan nantinya
        objekTitik.userData.materialDekat = materialDekat;
        objekTitik.userData.geometriDekat = geometriKelompokDekat;
        objekTitik.userData.materialJauh = materialJauh;
        objekTitik.userData.geometriJauh = geometriKelompokJauh;

        scene.add(objekTitik);
    };
}

// ---- CAHAYA LINGKUNGAN ----
const cahayaLingkungan = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(cahayaLingkungan);

// ---- MEMBUAT LATAR BINTANG ----
const jumlahBintang = 20000;
const geometriBintang = new THREE.BufferGeometry();
const posisiBintang = new Float32Array(jumlahBintang * 3);
for (let i = 0; i < jumlahBintang; i++) {
    posisiBintang[i * 3] = (Math.random() - 0.5) * 900;
    posisiBintang[i * 3 + 1] = (Math.random() - 0.5) * 900;
    posisiBintang[i * 3 + 2] = (Math.random() - 0.5) * 900;
}
geometriBintang.setAttribute('position', new THREE.BufferAttribute(posisiBintang, 3));

const materialBintang = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.7,
    transparent: true,
    opacity: 0.7,
    depthWrite: false
});
const lapanganBintang = new THREE.Points(geometriBintang, materialBintang);
lapanganBintang.name = 'lapangan-bintang';
lapanganBintang.renderOrder = 999;
scene.add(lapanganBintang);

// ---- MEMBUAT BINTANG JATUH ----
let bintangJatuh = [];

function buatBintangJatuh() {
    const panjangEkor = 100;

    // Kepala bintang jatuh
    const geometriKepala = new THREE.SphereGeometry(2, 32, 32);
    const materialKepala = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending
    });
    const kepala = new THREE.Mesh(geometriKepala, materialKepala);

    // Cahaya bintang jatuh
    const geometriCahaya = new THREE.SphereGeometry(3, 32, 32);
    const materialCahaya = new THREE.ShaderMaterial({
        uniforms: { waktu: { value: 0 } },
        vertexShader: `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            uniform float waktu;
            void main() {
                float intensitas = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                gl_FragColor = vec4(1.0, 1.0, 1.0, intensitas * (0.8 + sin(waktu * 5.0) * 0.2));
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
    });
    const cahaya = new THREE.Mesh(geometriCahaya, materialCahaya);
    kepala.add(cahaya);

    // Ekor bintang jatuh
    const kurva = buatKurvaAcak();
    const titikEkor = [];
    for (let i = 0; i < panjangEkor; i++) {
        const kemajuan = i / (panjangEkor - 1);
        titikEkor.push(kurva.getPoint(kemajuan));
    }
    const geometriEkor = new THREE.BufferGeometry().setFromPoints(titikEkor);
    const materialEkor = new THREE.LineBasicMaterial({
        color: 0x99eaff,
        transparent: true,
        opacity: 0.7,
        linewidth: 2
    });
    const ekor = new THREE.Line(geometriEkor, materialEkor);

    const kelompokBintangJatuh = new THREE.Group();
    kelompokBintangJatuh.add(kepala);
    kelompokBintangJatuh.add(ekor);
    kelompokBintangJatuh.userData = {
        kurva: kurva,
        kemajuan: 0,
        kecepatan: 0.001 + Math.random() * 0.001,
        umur: 0,
        umurMaks: 300,
        kepala: kepala,
        ekor: ekor,
        panjangEkor: panjangEkor,
        titikEkor: titikEkor,
    };
    scene.add(kelompokBintangJatuh);
    bintangJatuh.push(kelompokBintangJatuh);
}

function buatKurvaAcak() {
    const titikAwal = new THREE.Vector3(-200 + Math.random() * 100, -100 + Math.random() * 200, -100 + Math.random() * 200);
    const titikAkhir = new THREE.Vector3(600 + Math.random() * 200, titikAwal.y + (-100 + Math.random() * 200), titikAwal.z + (-100 + Math.random() * 200));
    const titikKontrol1 = new THREE.Vector3(titikAwal.x + 200 + Math.random() * 100, titikAwal.y + (-50 + Math.random() * 100), titikAwal.z + (-50 + Math.random() * 100));
    const titikKontrol2 = new THREE.Vector3(titikAkhir.x - 200 + Math.random() * 100, titikAkhir.y + (-50 + Math.random() * 100), titikAkhir.z + (-50 + Math.random() * 100));

    return new THREE.CubicBezierCurve3(titikAwal, titikKontrol1, titikKontrol2, titikAkhir);
}

// ---- MEMBUAT PLANET PUSAT ----

// Fungsi membuat tekstur untuk planet
function buatTeksturPlanet(ukuran = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = ukuran;
    const ctx = canvas.getContext('2d');

    // Latar gradien
    const gradien = ctx.createRadialGradient(ukuran / 2, ukuran / 2, ukuran / 8, ukuran / 2, ukuran / 2, ukuran / 2);
    gradien.addColorStop(0.00, '#f8bbd0');
    gradien.addColorStop(0.12, '#f48fb1');
    gradien.addColorStop(0.22, '#f06292');
    gradien.addColorStop(0.35, '#ffffff');
    gradien.addColorStop(0.50, '#e1aaff');
    gradien.addColorStop(0.62, '#a259f7');
    gradien.addColorStop(0.75, '#b2ff59');
    gradien.addColorStop(1.00, '#3fd8c7');
    ctx.fillStyle = gradien;
    ctx.fillRect(0, 0, ukuran, ukuran);

    // Bintik-bintik warna acak
    const warnaPlank = ['#f8bbd0', '#f8bbd0', '#f48fb1', '#f48fb1', '#f06292', '#f06292', '#ffffff', '#e1aaff', '#a259f7', '#b2ff59'];
    for (let i = 0; i < 40; i++) {
        const x = Math.random() * ukuran;
        const y = Math.random() * ukuran;
        const radius = 30 + Math.random() * 120;
        const warna = warnaPlank[Math.floor(Math.random() * warnaPlank.length)];
        const gradienPlank = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradienPlank.addColorStop(0, warna + 'cc'); // 'cc' adalah alpha
        gradienPlank.addColorStop(1, warna + '00');
        ctx.fillStyle = gradienPlank;
        ctx.fillRect(0, 0, ukuran, ukuran);
    }

    // Garis-garis melengkung (pusaran)
    for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * ukuran, Math.random() * ukuran);
        ctx.bezierCurveTo(Math.random() * ukuran, Math.random() * ukuran, Math.random() * ukuran, Math.random() * ukuran, Math.random() * ukuran, Math.random() * ukuran);
        ctx.strokeStyle = 'rgba(180, 120, 200, ' + (0.12 + Math.random() * 0.18) + ')';
        ctx.lineWidth = 8 + Math.random() * 18;
        ctx.stroke();
    }

    // Terapkan blur
    if (ctx.filter !== undefined) {
        ctx.filter = 'blur(2px)';
        ctx.drawImage(canvas, 0, 0);
        ctx.filter = 'none';
    }

    return new THREE.CanvasTexture(canvas);
}

// Shader untuk efek badai di permukaan planet
const shaderBadai = {
    uniforms: {
        waktu: { value: 0.0 },
        teksturDasar: { value: null }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position
