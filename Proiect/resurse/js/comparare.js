document.addEventListener("DOMContentLoaded", () => {
    // 1. Verificăm dacă suntem pe o pagină relevantă (există butoane de comparare)
    // Astfel containerul nu se randează pe "Despre" sau "Home"
    const existaButoane = document.querySelector(".btn-compara") !== null;
    if (!existaButoane) return;

    const TIMP_EXPIRARE = 24 * 60 * 60 * 1000; // 1 zi în milisecunde

    // 2. Funcții manipulare LocalStorage
    function obtineDateComparare() {
        let date = localStorage.getItem("comparareProduse");
        let timestamp = localStorage.getItem("comparareTimestamp");
        
        if (date && timestamp) {
            // Dacă a trecut mai mult de o zi de la ultimul click, ștergem tot
            if (Date.now() - parseInt(timestamp) > TIMP_EXPIRARE) {
                localStorage.removeItem("comparareProduse");
                localStorage.removeItem("comparareTimestamp");
                return [];
            }
            return JSON.parse(date);
        }
        return [];
    }

    function salveazaDateComparare(date) {
        localStorage.setItem("comparareProduse", JSON.stringify(date));
        localStorage.setItem("comparareTimestamp", Date.now().toString());
    }

    // 3. Generare DOM dinamic pentru container și tooltip
    let container = document.createElement("div");
    container.id = "container-comparare";
    document.body.appendChild(container);

    let tooltip = document.createElement("div");
    tooltip.id = "tooltip-comparare";
    tooltip.innerText = "ștergeți un produs din lista de comparare";
    document.body.appendChild(tooltip);

    // 4. Actualizare interfață (UI)
    function actualizareUI() {
        let produse = obtineDateComparare();
        let butoane = document.querySelectorAll(".btn-compara");

        // Dacă nu avem produse
        if (produse.length === 0) {
            container.style.display = "none";
            butoane.forEach(b => b.classList.remove("dezactivat"));
        } else {
            // Avem cel puțin un produs
            container.style.display = "block";
            container.innerHTML = "<h4 style='text-align:center; border-bottom:1px solid #000; padding-bottom:10px;'>Comparare Produse</h4>";

            produse.forEach(p => {
                let div = document.createElement("div");
                div.className = "produs-comparat";
                div.innerHTML = `<span>${p.nume}</span> <button class="btn-sterge-compara" data-id="${p.id}">X</button>`;
                container.appendChild(div);
            });

            // Dacă avem 2 produse, blocăm butoanele și afișăm butonul de deschidere
            if (produse.length >= 2) {
                let btnAfisare = document.createElement("button");
                btnAfisare.innerText = "Afișează";
                btnAfisare.id = "btn-afiseaza-comparare";
                btnAfisare.onclick = deschideFereastra;
                container.appendChild(btnAfisare);

                butoane.forEach(b => b.classList.add("dezactivat"));
            } else {
                butoane.forEach(b => b.classList.remove("dezactivat"));
            }

            // Evenimente pentru ștergere din container
            document.querySelectorAll(".btn-sterge-compara").forEach(btn => {
                btn.onclick = function() {
                    let idSters = this.getAttribute("data-id");
                    let produseNoi = obtineDateComparare().filter(prod => prod.id !== idSters);
                    salveazaDateComparare(produseNoi);
                    tooltip.style.display = "none"; // Reset tooltip just in case
                    actualizareUI();
                };
            });
        }
    }

    // 5. Tooltip personalizat la mousemove
    document.body.addEventListener("mousemove", (e) => {
        if (e.target.classList.contains("btn-compara") && e.target.classList.contains("dezactivat")) {
            tooltip.style.display = "block";
            tooltip.style.left = e.pageX + 15 + "px";
            tooltip.style.top = e.pageY + 15 + "px";
        } else {
            tooltip.style.display = "none";
        }
    });

    // 6. Adăugare produs la comparare
    document.body.addEventListener("click", (e) => {
        if (e.target.classList.contains("btn-compara")) {
            if (e.target.classList.contains("dezactivat")) return; // Prevenim click-ul

            let lista = obtineDateComparare();
            if (lista.length >= 2) return;

            let id = e.target.getAttribute("data-id");
            if (lista.find(p => p.id === id)) {
                alert("Produsul este deja în listă!");
                return;
            }

            // Preluăm setul de specificații pentru noul tab
            lista.push({
                id: id,
                nume: e.target.getAttribute("data-nume"),
                pret: e.target.getAttribute("data-pret"),
                categorie: e.target.getAttribute("data-categorie"),
                bile: e.target.getAttribute("data-bile")
            });

            salveazaDateComparare(lista);
            actualizareUI();
        }
    });

    // 7. Generare fereastră nouă paralelă
    function deschideFereastra() {
        let produse = obtineDateComparare();
        if (produse.length !== 2) return;

        let fereastraNoua = window.open("", "_blank", "width=800,height=400");
        
        // Randăm tabelul direct prin scrierea HTML-ului în DOM-ul ferestrei noi
        let htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Comparare ${produse[0].nume} vs ${produse[1].nume}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; background-color: #f8f9fa; }
                    h2 { text-align: center; color: #333; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
                    th, td { border: 1px solid #dee2e6; padding: 12px; text-align: center; width: 33%; }
                    th { background-color: #343a40; color: white; }
                    .row-highlight { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                <h2>Tabel Comparativ</h2>
                <table>
                    <tr>
                        <th>Specificație</th>
                        <th>${produse[0].nume}</th>
                        <th>${produse[1].nume}</th>
                    </tr>
                    <tr>
                        <td><strong>Preț</strong></td>
                        <td>${produse[0].pret} RON</td>
                        <td>${produse[1].pret} RON</td>
                    </tr>
                    <tr class="row-highlight">
                        <td><strong>Categorie Replică</strong></td>
                        <td>${produse[0].categorie}</td>
                        <td>${produse[1].categorie}</td>
                    </tr>
                    <tr>
                        <td><strong>Greutate Bile Optime</strong></td>
                        <td>${produse[0].bile} g</td>
                        <td>${produse[1].bile} g</td>
                    </tr>
                </table>
            </body>
            </html>
        `;
        
        fereastraNoua.document.write(htmlContent);
        fereastraNoua.document.close();
    }

    // Inițializare script la încărcarea paginii
    actualizareUI();
});