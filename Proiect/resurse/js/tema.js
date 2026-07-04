document.addEventListener("DOMContentLoaded", function() {
    const selectorTema = document.getElementById("schimbator-tema");
    
    const temaActiva = localStorage.getItem("tema-preferata") || "tema-dark";
    document.body.className = temaActiva;
    
    if (selectorTema) {
        selectorTema.value = temaActiva;
        
        selectorTema.onchange = function() {
            const nouaTema = this.value;
        
            document.body.classList.remove("tema-dark", "tema-light", "tema-army");
            document.body.classList.add(nouaTema);
            localStorage.setItem("tema-preferata", nouaTema);
        };
    }
});