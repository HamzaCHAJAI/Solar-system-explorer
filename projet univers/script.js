document.getElementById("planetSelect").addEventListener("change", function () {
    const destination = this.value;

    if (destination && !window.location.href.includes(destination)) {
        window.location.href = destination;
    }
});



if (!destination.includes("jupiter")) {
    window.location.href = destination;
}

console.log("JS chargé");