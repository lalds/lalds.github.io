const images = [
    "https://i.pinimg.com/736x/c2/35/c8/c235c803f9de63e7606886fea328a24e.jpg",
    "https://i.pinimg.com/736x/0a/4f/27/0a4f27fdefe01540f009b2161dc8924d.jpg",
    "https://i.pinimg.com/736x/f0/d9/7b/f0d97bbde930e6904e02edd374023ac7.jpg",
];


const japanesegirl = document.getElementById("japanesegirl")

let currentIndex = 0;

function changeImage() {
    currentIndex =  (currentIndex + 1) % images.length;
    japanesegirl.src = images[currentIndex];
}


setInterval(changeImage, 3000);