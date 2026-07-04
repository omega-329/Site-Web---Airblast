window.onload = function() {

    // Salvează referințele către elemente
    const sliderPret = document.getElementById("inp-pret");
    const txtArea = document.getElementById("inp-nume");
    const selectCuloare = document.getElementById("inp-categorie");
    const grupRadio = document.getElementsByName("gr_rad");

    //pagini
    let paginaCurenta = 1;
    const K = 3;

    if (sliderPret) {
        document.getElementById("infoRange").innerHTML = `(${sliderPret.value})`;
    }   

    //normalize
    function eliminaDiacritice(text) {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[șş]/g, "s")
        .replace(/[țţ]/g, "t");
    }

    // ==========================================================================
    // 1. FUNCȚIA DE FILTRARE & PAGINARE
    // ==========================================================================
    function aplicaFiltre() {
        let inpNume = txtArea ? eliminaDiacritice(txtArea.value.trim().toLowerCase()) : "";

        let categorieRadio = "toate";
        for (let rad of grupRadio) {
            if (rad.checked) {
                categorieRadio = rad.value.toLowerCase();
                break;
            }
        }

        let inpPretMin = sliderPret ? parseFloat(sliderPret.value.trim()) : 0;
        let inpCategorie = selectCuloare ? selectCuloare.value.trim().toLowerCase() : "toate";

        let produse = document.getElementsByClassName("produs");
        
        let produseFiltrate = [];

        for (let prod of produse) {
            prod.style.display = "none"; 
            let idCurent = prod.querySelector(".select-cos")?.value;
            let produseAscunseSesiune = JSON.parse(sessionStorage.getItem("produse_ascunse") || "[]");
            if (idCurent && produseAscunseSesiune.includes(idCurent)) {
                continue;
            }

            let estePinned = prod.classList.contains("produs-pinned");
            let numeEl = prod.getElementsByClassName("val-nume")[0];
            let cond1 = numeEl ? eliminaDiacritice(numeEl.innerHTML.trim().toLowerCase()).includes(inpNume) : true;

            let valReplicaEl = prod.getElementsByClassName("val-replica")[0];
            let cond2 = true;
            if (valReplicaEl) {
                let valReplica = valReplicaEl.innerHTML.trim().toLowerCase();
                cond2 = (categorieRadio === "toate" || valReplica === categorieRadio);
            }

            let pretEl = prod.getElementsByClassName("val-pret")[0];
            let cond3 = true;
            if (pretEl) {
                let pret = parseFloat(pretEl.innerHTML.trim());
                cond3 = pret >= inpPretMin;
            }

            let valCuloriEl = prod.getElementsByClassName("val-culori")[0];
            let cond4 = true;
            if (valCuloriEl) {
                let valCulori = valCuloriEl.innerHTML.trim().toLowerCase();
                cond4 = (inpCategorie === "toate" || valCulori.includes(inpCategorie));
            }

            if (estePinned || (cond1 && cond2 && cond3 && cond4)) {
                produseFiltrate.push(prod);
            }
        }

        let N = produseFiltrate.length;
        let NRL = Math.ceil(N / K);

        if (paginaCurenta > NRL) {
            paginaCurenta = 1;
        }

        let contorVizibile = 0;
        
        produseFiltrate.forEach((prod, index) => {
            if (index >= (paginaCurenta - 1) * K && index < paginaCurenta * K) {
                prod.style.display = "block";
                contorVizibile++;
            }
        });

        //vidare
        let mesajVida = document.getElementById("mesaj-filtrare-vida");
        if (mesajVida) {
            mesajVida.style.display = (N === 0) ? "block" : "none";
        }

        const produseVizibile = document.querySelectorAll('.produs[style="display: block;"], .produs:not([style*="display: none"])');
        const infoProduse = document.getElementById("info-produse");
        
        if (infoProduse) {
            infoProduse.innerText = `Se afișează: ${produseVizibile.length} produse`;
        }

        genereazaPaginare(NRL);
        marcheazaCelMaiIeftin();
    }

    function marcheazaCelMaiIeftin() {
            const containereProduse = document.querySelectorAll(".produs");
            const categorii = {};

            containereProduse.forEach(p => {
                const cat = p.querySelector(".val-replica")?.innerText;
                const pret = parseFloat(p.querySelector(".val-pret")?.innerText);

                if (!categorii[cat] || pret < categorii[cat].pret) {
                    categorii[cat] = { pret: pret, element: p };
                }
            });

            document.querySelectorAll(".eticheta-ieftin").forEach(e => e.remove());

            for (let cat in categorii) {
                const celMaiIeftin = categorii[cat].element;
                const divEticheta = document.createElement("div");
                divEticheta.className = "eticheta-ieftin";
                divEticheta.innerText = "CEL MAI IEFTIN";
                
                celMaiIeftin.appendChild(divEticheta);
            }
        }
    
    // ==========================================================================
    // FUNCȚIE AUXILIARĂ: GENERARE BUTOANE PAGINARE
    // ==========================================================================
    function genereazaPaginare(NRL) {
        const container = document.getElementById("container-paginare");
        if (!container) return;
        
        container.innerHTML = ""; // Curățăm vechile butoane

        // Dacă avem o singură pagină sau deloc, nu are rost să aglomerăm interfața cu butoane inutile
        if (NRL <= 1) return; 

        for (let i = 1; i <= NRL; i++) {
            let btn = document.createElement("button");
            btn.innerText = i;
            // Bootstrap classes pentru un aspect curat; evidențiem pagina activă
            btn.className = `btn btn-sm ${i === paginaCurenta ? 'btn-primary' : 'btn-outline-primary'}`;
            
            btn.onclick = function() {
                paginaCurenta = i;
                aplicaFiltre(); // Re-evaluăm afișarea elementelor pentru noua pagină
            };
            container.appendChild(btn);
        }
    }

    // ==========================================================================
    // 2. LEGAREA EVENIMENTELOR LIVE (Resetăm pagina la 1 când filtrele se schimbă)
    // ==========================================================================
    if (txtArea) {
        txtArea.addEventListener("input", function() {
            let valoare = this.value.trim();
            let regexInvalid = /[<>]/g;
            if ((valoare.length > 0 && valoare.length < 3) || regexInvalid.test(valoare)) {
                this.classList.add("is-invalid");
                this.classList.remove("is-valid");
            } else {
                this.classList.remove("is-invalid");
                if (valoare.length >= 3) {
                    this.classList.add("is-valid");
                }
            }
            paginaCurenta = 1; 
            aplicaFiltre();
        });
    }

    if (sliderPret) {
        sliderPret.oninput = function() {
            document.getElementById("infoRange").innerHTML = `(${this.value.trim()})`;
            paginaCurenta = 1;
            aplicaFiltre();
        };
        sliderPret.onchange = function() {
            paginaCurenta = 1;
            aplicaFiltre();
        };
    }

    for (let rad of grupRadio) {
        rad.onchange = function() {
            paginaCurenta = 1;
            aplicaFiltre();
        };
    }

    if (selectCuloare) {
        selectCuloare.onchange = function() {
            paginaCurenta = 1;
            aplicaFiltre();
        };
    }

    const btnFiltrare = document.getElementById("filtrare");
    if (btnFiltrare) {
        btnFiltrare.onclick = function() {
            paginaCurenta = 1;
            aplicaFiltre();
        };
    }

    // ==========================================================================
    // 3. LOGICA DE RESETARE
    // ==========================================================================
    const btnResetare = document.getElementById("resetare");
    if (btnResetare) {
        btnResetare.onclick = function() {
            if (txtArea) {
                txtArea.value = "";
                txtArea.classList.remove("is-invalid", "is-valid");
            }
            
            if (sliderPret) {
                sliderPret.value = sliderPret.min || "0";
                document.getElementById("infoRange").innerHTML = `(${sliderPret.value})`;
            }
            
            if (selectCuloare) {
                selectCuloare.value = "toate";
            }
            
            let radToate = document.getElementById("i_rad9") || document.getElementById("rad-toate");
            if (!radToate) {
                for (let r of grupRadio) {
                    if (r.value === "toate") { radToate = r; break; }
                }
            }
            if (radToate) {
                radToate.checked = true;
            }

            // Resetăm starea paginii la prima pagină și refacem filtrele inițiale
            paginaCurenta = 1;
            aplicaFiltre();
        };
    }

    // ==========================================================================
    // 4. FUNCȚIILE DE SORTARE ȘI TASTA ALT+C
    // ==========================================================================
    function sortare(semn) {
        let produse = document.getElementsByClassName("produs");
        let vProduse = Array.from(produse);

        vProduse.sort(function(a, b) {
            let pretA = parseFloat(a.getElementsByClassName("val-pret")[0].innerHTML.trim());
            let pretB = parseFloat(b.getElementsByClassName("val-pret")[0].innerHTML.trim());
            
            if (pretA == pretB) {
                let numeA = a.getElementsByClassName("val-nume")[0].innerHTML.trim().toLowerCase();
                let numeB = b.getElementsByClassName("val-nume")[0].innerHTML.trim().toLowerCase();
                return semn * numeA.localeCompare(numeB);
            }
            return semn * (pretA - pretB);
        });

        let grid = document.querySelector(".grid-produse");
        if (grid) {
            for (let prod of vProduse) {
                grid.appendChild(prod);
            }
        }
        
        aplicaFiltre(); 
    }

    const btnSortCresc = document.getElementById("sortCrescNume");
    if (btnSortCresc) btnSortCresc.onclick = () => sortare(1);

    const btnSortDescresc = document.getElementById("sortDescrescNume");
    if (btnSortDescresc) btnSortDescresc.onclick = () => sortare(-1);

    window.onkeydown = function(e) {
        if (e.key == "c" && e.altKey) {
            let produse = document.getElementsByClassName("produs");
            let suma = 0;
            
            for (let prod of produse) {
                if (prod.style.display != "none") {
                    let pretEl = prod.getElementsByClassName("val-pret")[0];
                    if (pretEl) {
                        suma += parseFloat(pretEl.innerHTML.trim());
                    }
                }
            }

            let p = document.getElementById("infoSuma");
            if (!p) {
                p = document.createElement("p");
                p.id = "infoSuma";
                p.className = "alert alert-info mt-3 fw-bold";
                p.innerHTML = "Suma prețurilor afișate: " + suma.toFixed(2) + " RON";
                
                let gridProduse = document.querySelector(".grid-produse");
                if (gridProduse) {
                    gridProduse.parentElement.insertBefore(p, gridProduse);
                }

                setTimeout(function() {
                    let p1 = document.getElementById("infoSuma");
                    if (p1) p1.remove();
                }, 2000);
            } else {
                p.innerHTML = "Suma prețurilor afișate: " + suma.toFixed(2) + " RON";
            }
        }
    };

    let elementeProduse = document.getElementsByClassName("produs");
    
    for (let prod of elementeProduse) {
        let idProdus = prod.querySelector(".select-cos")?.value;

        let btnPin = prod.querySelector(".btn-pin");
        if (btnPin) {
            btnPin.onclick = function(e) {
                e.preventDefault();
                prod.classList.toggle("produs-pinned");
                
                if (prod.classList.contains("produs-pinned")) {
                    prod.style.border = "3px solid var(--culoare-headere)";
                    prod.style.backgroundColor = "rgba(255, 255, 0, 0.1)"; 
                    btnPin.className = "btn btn-sm btn-warning btn-pin";
                } else {
                    prod.style.border = "";
                    prod.style.backgroundColor = "";
                    btnPin.className = "btn btn-sm btn-outline-secondary btn-pin";
                }
                aplicaFiltre();
            };
        }

        let btnTemp = prod.querySelector(".btn-ascunde-temp");
        if (btnTemp) {
            btnTemp.onclick = function(e) {
                e.preventDefault();
                prod.style.display = "none";
            };
        }

        let btnSesiune = prod.querySelector(".btn-ascunde-sesiune");
        if (btnSesiune) {
            btnSesiune.onclick = function(e) {
                e.preventDefault();
                if (!idProdus) return;
                
                let ascunse = JSON.parse(sessionStorage.getItem("produse_ascunse") || "[]");
                if (!ascunse.includes(idProdus)) {
                    ascunse.push(idProdus);
                    sessionStorage.setItem("produse_ascunse", JSON.stringify(ascunse));
                }
                aplicaFiltre();
            };
        }

        // ==========================================================================
        // [BONUS 8] LOGICĂ SORTARE DUBLĂ DIN INTERFAȚĂ
        // ==========================================================================
        const btnSortDubla = document.getElementById("btn-sort-dubla");
        
        if (btnSortDubla) {
            btnSortDubla.onclick = function() {
                const cheie1 = document.getElementById("sel-sort-cheie1").value;
                const cheie2 = document.getElementById("sel-sort-cheie2").value;
                const ordine = parseInt(document.getElementById("sel-sort-ordine").value);

                if (cheie1 === cheie2) {
                    alert("Nu are niciun sens să selectezi aceeași cheie pentru ambele criterii.");
                    return;
                }

                function extrageValoare(produs, cheie) {
                    if (cheie === "pret") {
                        let pretEl = produs.getElementsByClassName("val-pret")[0];
                        return pretEl ? parseFloat(pretEl.innerHTML.trim()) : 0;
                    }
                    if (cheie === "nume") {
                        let numeEl = produs.getElementsByClassName("val-nume")[0];
                        return numeEl ? numeEl.innerHTML.trim().toLowerCase() : "";
                    }
                    if (cheie === "categorie") {
                        let catEl = produs.getElementsByClassName("val-replica")[0];
                        return catEl ? catEl.innerHTML.trim().toLowerCase() : "";
                    }
                    return "";
                }

                function comparaValori(a, b) {
                    if (typeof a === "string") {
                        return a.localeCompare(b);
                    }
                    return a - b;
                }

                let produse = document.getElementsByClassName("produs");
                let vectorProduse = Array.from(produse);

                vectorProduse.sort(function(prodA, prodB) {
                    let valA1 = extrageValoare(prodA, cheie1);
                    let valB1 = extrageValoare(prodB, cheie1);

                    let rezultat1 = comparaValori(valA1, valB1);
                    
                    if (rezultat1 === 0) {
                        let valA2 = extrageValoare(prodA, cheie2);
                        let valB2 = extrageValoare(prodB, cheie2);
                        return ordine * comparaValori(valA2, valB2);
                    }
                    
                    return ordine * rezultat1;
                });

                let grid = document.querySelector(".grid-produse");
                if (grid) {
                    for (let prod of vectorProduse) {
                        grid.appendChild(prod);
                    }
                }
                
                aplicaFiltre();
            };
        }
const btnServer = document.getElementById("btn-filtrare-server");
    
        if (btnServer) {
            btnServer.onclick = async function() {
                const valNume = document.getElementById("inp-nume")?.value || "";
                const valPretMin = document.getElementById("inp-pret")?.value || "";
                
                const valGreutate = document.getElementById("inp-greutate")?.value || "toate";
                const valCuloare = document.getElementById("inp-categorie")?.value || "toate"; 
                
                const cheie1 = document.getElementById("sel-sort-cheie1")?.value || "nume";
                const cheie2 = document.getElementById("sel-sort-cheie2")?.value || "pret";
                const ordine = document.getElementById("sel-sort-ordine")?.value || "1";

                const url = `/api/produse-filtrate?nume=${encodeURIComponent(valNume)}&pret_min=${valPretMin}&greutate=${valGreutate}&culoare=${encodeURIComponent(valCuloare)}&cheie1=${cheie1}&cheie2=${cheie2}&ordine=${ordine}`;

                try {
                    const response = await fetch(url);
                    const readyData = await response.json(); 

                    let elementeProduseDOM = Array.from(document.getElementsByClassName("produs"));
                    let contor = 0;

                    elementeProduseDOM.forEach(prod => prod.style.display = "none");

                    readyData.forEach(prodData => {
                        let id = prodData.id.toString();
                        let prodElementDOM = elementeProduseDOM.find(p => p.querySelector(".select-cos")?.value === id);
                        if (prodElementDOM) {
                            prodElementDOM.style.display = "block"; 
                            contor++;
                        }
                    });

                    const infoProduse = document.getElementById("info-produse");
                    if (infoProduse) infoProduse.innerText = `Se afișează: ${contor} produse`;

                    if (typeof marcheazaCelMaiIeftin === 'function') marcheazaCelMaiIeftin();

                } catch (error) {
                    console.error("Eroare filtrare:", error);
                }
            };
        }
    }

    aplicaFiltre();

    // ==========================================
    // LOGICA MODAL
    // ==========================================
    const modal = document.getElementById("modal-produs");
    const btnInchide = document.getElementById("inchide-modal");
    const modalCorp = document.getElementById("modal-corp-date");
    const containereImagini = document.querySelectorAll(".imagine-produs");

    containereImagini.forEach(containerImg => {
        containerImg.style.cursor = "pointer";
        containerImg.onclick = function() {
            const articolParinte = this.closest(".produs");
            const nume = articolParinte.querySelector(".nume")?.innerText || "Fără nume";
            const imagineSrc = this.querySelector("img")?.src || "";
            const descriere = articolParinte.querySelector(".descriere-produs p")?.innerText || "";
            const pret = articolParinte.querySelector(".val-pret")?.innerText || "0";
            const categorie = articolParinte.querySelector(".val-replica")?.innerText || "-";
            const bile = articolParinte.querySelector(".val-categorie")?.innerText || "-";
            const atasament = articolParinte.querySelector(".val-atasament")?.innerText || "Nu";

            modalCorp.innerHTML = `
                <h3>${nume}</h3>
                <div style="text-align: center; margin-bottom: 15px;">
                    <img src="${imagineSrc}" alt="${nume}" style="max-width: 250px; border-radius: 4px;">
                </div>
                <p><strong>Descriere:</strong> ${descriere}</p>
                <p><strong>Categorie:</strong> ${categorie}</p>
                <p><strong>Greutate Bile:</strong> ${bile} g</p>
                <p><strong>Atașamente:</strong> ${atasament}</p>
                <p style="font-size: 1.2rem; font-weight: bold; margin-top: 15px;">Preț: ${pret} RON</p>
            `;
            modal.style.display = "block";
        };
    });

    if (btnInchide) btnInchide.onclick = () => { modal.style.display = "none"; };
    window.onclick = function(event) { if (event.target === modal) modal.style.display = "none"; };

    // ==========================================
    // LOGICA OFERTE GENERATE DIN JSON
    // ==========================================
    async function actualizeazaOferte() {
        try {
            const res = await fetch('/resurse/JSON/oferte.json?t=' + Date.now());
            if (!res.ok) throw new Error("Serverul a returnat status: " + res.status);

            const jsonResponse = await res.json();
            if (!jsonResponse || !jsonResponse.oferte || jsonResponse.oferte.length === 0) return;

            const ofertaCurenta = jsonResponse.oferte[0];
            const diferenta = new Date(ofertaCurenta['data-finalizare']) - new Date();
            const timerEl = document.getElementById("timer");

            if (timerEl) {
                if (diferenta <= 0) {
                    timerEl.innerText = "Oferta a expirat!";
                } else {
                    const secundeRamase = Math.floor(diferenta / 1000);
                    timerEl.innerText = `Reducere ${ofertaCurenta.reducere}% la ${ofertaCurenta.categorie}: ${secundeRamase}s`;
                    timerEl.style.color = (secundeRamase <= 10) ? "red" : "inherit";
                }
            }

            const produse = document.querySelectorAll(".produs");
            produse.forEach(p => {
                const catEl = p.querySelector(".val-replica");
                if (!catEl) return;
                
                const cat = catEl.innerText.trim();
                const pretEl = p.querySelector(".val-pret");
                
                if (cat === ofertaCurenta.categorie) {
                    const pretOriginal = parseFloat(pretEl.dataset.original || pretEl.innerText);
                    if (!pretEl.dataset.original) pretEl.dataset.original = pretOriginal;
                    const pretRedus = (pretOriginal * (1 - ofertaCurenta.reducere / 100)).toFixed(2);
                    pretEl.innerHTML = `<del>${pretOriginal}</del> <span style="color:red; font-weight:bold;">${pretRedus}</span>`;
                } else if (pretEl.dataset.original) {
                    pretEl.innerText = pretEl.dataset.original;
                    delete pretEl.dataset.original;
                }
            });
        } catch (err) {
        }
    }

    actualizeazaOferte();
    setInterval(actualizeazaOferte, 1000);
};