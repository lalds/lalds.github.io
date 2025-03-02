const images = [
    "https://i.pinimg.com/736x/c2/35/c8/c235c803f9de63e7606886fea328a24e.jpg",
    "https://i.pinimg.com/736x/0a/4f/27/0a4f27fdefe01540f009b2161dc8924d.jpg",
    "https://i.pinimg.com/736x/f0/d9/7b/f0d97bbde930e6904e02edd374023ac7.jpg",
    "https://i.pinimg.com/736x/dc/d3/90/dcd3909fbe6a68c1228c12acce05ba75.jpg",
    "https://i.pinimg.com/736x/32/cd/f8/32cdf82aae412c2c11ba4e2a09f8fc88.jpg",
    "https://i.pinimg.com/736x/78/e3/4b/78e34bed19ae343be13529dc1761435c.jpg"
];


const japanesegirl = document.getElementById("japanesegirl")

let currentIndex = 0;

function changeImage() {
    currentIndex =  (currentIndex + 1) % images.length;
    japanesegirl.src = images[currentIndex];
}


setInterval(changeImage, 3000);