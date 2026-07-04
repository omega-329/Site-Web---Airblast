const express= require("express");
const path= require("path");
const fs=require("fs");
const sass=require("sass");
const sharp= require("sharp");
const pg = require("pg");

app= express();
app.set("view engine", "ejs")

//OFerte
const fisierOferte = path.join(__dirname, 'resurse/JSON/oferte.json');
const T = 60 * 1000;
const T2 = 5 * 60 * 1000; 

obGlobal={
    obErori:null,
    obImagini:null,
    folderScss: path.join(__dirname,"resurse/SCSS"),
    folderCss: path.join(__dirname,"resurse/CSS"),
    folderBackup: path.join(__dirname,"backup"),
}

//Backness
const T_BACKUP = 14400 * 60 * 1000; 

function curataBackup() {
    const caleBackup = obGlobal.folderBackup;
    
    if (!fs.existsSync(caleBackup)) return;

    function parcurgeSiSterge(director) {
        fs.readdirSync(director).forEach(file => {
            const caleFisier = path.join(director, file);
            const stats = fs.statSync(caleFisier);

            if (stats.isDirectory()) {
                parcurgeSiSterge(caleFisier);
            } else {
                const timpFisier = stats.mtime.getTime();
                const timpCurent = new Date().getTime();
                
                if (timpCurent - timpFisier > T_BACKUP) {
                    console.log(`Ștergere backup vechi: ${file}`);
                    fs.unlinkSync(caleFisier);
                }
            }
        });
    }

    try {
        parcurgeSiSterge(caleBackup);
    } catch (err) {
        console.error("Eroare la curățarea backup-ului:", err);
    }
}

setInterval(curataBackup, 60 * 1000);

console.log("Folder index.js", __dirname);
console.log("Folder curent (de lucru)", process.cwd());
console.log("Cale fisier", __filename);

client=new pg.Client({
    database:"cti_2026",
    user:"muy_bien",
    password:"neib_yum",
    host:"localhost",
    port:5432
})
client.connect();

let vect_foldere=[ "temp", "logs", "backup", "fisiere_uploadate" ]
for (let folder of vect_foldere){
    let caleFolder=path.join(__dirname, folder);
    if (!fs.existsSync(caleFolder)) {
        fs.mkdirSync(path.join(caleFolder), {recursive:true});   
    }
}

//OFFERS
async function genereazaOferta() {
    let raw = fs.readFileSync(fisierOferte);
    let date = JSON.parse(raw);
    let oferte = date.oferte;

    const { rows } = await client.query("SELECT DISTINCT tip_replica FROM replici");
    const categorii = rows.map(r => r.tip_replica);

    let catNoua;
    do {
        catNoua = categorii[Math.floor(Math.random() * categorii.length)];
    } while (oferte.length > 0 && oferte[0].categorie === catNoua);

    let reducere = [5,10,15,20,25,30,35,40,45,50][Math.floor(Math.random() * 10)];
    let acum = new Date();
    let final = new Date(acum.getTime() + T);

    oferte.unshift({
        categorie: catNoua,
        reducere: reducere,
        'data-incepere': acum.toISOString(),
        'data-finalizare': final.toISOString()
    });

    date.oferte = oferte.filter(o => (acum - new Date(o['data-finalizare'])) < T2);

    fs.writeFileSync(fisierOferte, JSON.stringify(date, null, 4));
}

setInterval(genereazaOferta, T);

app.use((req, res, next) => {
    res.locals.ip = req.ip;
    next();
});

app.use("/resurse",express.static(path.join(__dirname, "resurse")));
app.use("/dist",express.static(path.join(__dirname, "node_modules/bootstrap/dist")));

app.get("/favicon.ico", function(req, res){
    res.sendFile(path.join(__dirname,"resurse/imagini/favicon/favicon.ico"))
});

app.get(["/", "/index","/home"], function(req, res){
    res.render("pagini/index", {
        imagini:obGlobal.obImagini.imagini
    });
});

app.get("/despre", function(req, res) {
    const acum = new Date();   
    const minut = acum.getMinutes();
    const sfertCurent = Math.floor(minut / 15) + 1;

    let imaginiFiltrate = obGlobal.obImagini.imagini.filter(img => {
        let sferturi = img.sfert_ora.split(",").map(s => s.trim());
        return sferturi.includes(sfertCurent.toString());
    }).slice(0, 10);

    res.render("pagini/despre", {
        imagini: imaginiFiltrate
    });
});

app.get('/resurse/JSON/oferte.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'resurse/JSON/oferte.json'));
});

app.get("/produse", async function(req, res) {
    try {
        let clauzaWhere = "";
        let parametri = [];
        
        if (req.query.tip) {
            clauzaWhere = "WHERE tip_replica = $1";
            parametri.push(req.query.tip);
        }

        const produseResult = await client.query(`SELECT * FROM replici ${clauzaWhere}`, parametri);
        
        const pretResult = await client.query('SELECT MIN(pret) as min_pret, MAX(pret) as max_pret FROM replici');
        const minPret = pretResult.rows[0].min_pret || 0;
        const maxPret = pretResult.rows[0].max_pret || 1000;

        const categoriiResult = await client.query('SELECT DISTINCT tip_replica AS tip FROM replici WHERE tip_replica IS NOT NULL');
        
        const optiuniResult = await client.query('SELECT DISTINCT unnest(culoare) AS cul FROM replici WHERE culoare IS NOT NULL ORDER BY cul');

        res.render("pagini/produse", {
            produse: produseResult.rows,
            minPret: minPret,
            maxPret: maxPret,
            categorii: categoriiResult.rows,
            culori: optiuniResult.rows
        });

    } catch (err) {
        console.error("Eroare gravă la baza de date:", err);
        if (typeof afisareEroare === "function") {
            afisareEroare(res, 2);
        } else {
            res.status(500).send("Eroare internă la încărcarea produselor.");
        }
    }
});


app.get("/produse/:id", function(req, res){
    client.query(`select * from replici where id=${req.params.id}`, function(err, rez){
        if (err){
            console.log("Eroare la baza de date:", err);
            afisareEroare(res, 2);
        }
        else {
            if(rez.rowCount == 0){
                afisareEroare(res, 404, "Produs inexistent");
            }
            else {
                res.render("pagini/produs", {
                    prod: rez.rows[0]
                });
            }
        }
    });
});

// cos
app.use(["/produse_cos","/cumpara"],express.json({limit:'2mb'}));

function initErori(){
    let continut = fs.readFileSync(path.join(__dirname,"resurse/JSON/erori.json")).toString("utf-8");
    let erori=obGlobal.obErori=JSON.parse(continut)
    let err_default=erori.eroare_default
    err_default.imagine=path.join(erori.cale_baza, err_default.imagine)
    for (let eroare of erori.info_erori){
        eroare.imagine=path.join(erori.cale_baza, eroare.imagine)
    }

}
initErori()


function afisareEroare(res, identificator, titlu, text, imagine){
    let eroare= obGlobal.obErori.info_erori.find((elem) => 
        elem.identificator == identificator
    )
    let errDefault= obGlobal.obErori.eroare_default;
    if(eroare?.status)
        res.status(eroare.identificator)
    res.render("pagini/eroare",{
        imagine: imagine || eroare?.imagine || errDefault.imagine,
        titlu: titlu || eroare?.titlu || errDefault.titlu,
        text: text || eroare?.text || errDefault.text,
    });

}


app.get("/eroare", function(req, res){
    afisareEroare(res,404, "Titlu!!!")
});

function initImagini(){
    var continut= fs.readFileSync(path.join(__dirname,"resurse/JSON/galerie.json")).toString("utf-8");

    obGlobal.obImagini=JSON.parse(continut);
    let vImagini=obGlobal.obImagini.imagini;
    let caleGalerie=obGlobal.obImagini.cale_galerie

    let caleAbs=path.join(__dirname,caleGalerie);
    let caleAbsMediu=path.join(caleAbs, "mediu");
    if (!fs.existsSync(caleAbsMediu))
        fs.mkdirSync(caleAbsMediu);
    
    for (let imag of vImagini){
        [numeFis, ext]=imag.cale_imagine.split("."); //"ceva.png" -> ["ceva", "png"]
        let caleFisAbs=path.join(caleAbs,imag.cale_imagine);
        let caleFisMediuAbs=path.join(caleAbsMediu, numeFis+".webp");
        sharp(caleFisAbs).resize(300).toFile(caleFisMediuAbs);
        imag.cale_imagine=path.join("/", caleGalerie, "mediu", numeFis+".webp" )
    }
    // console.log(obGlobal.obImagini)
}
initImagini();

function compileazaScss(caleScss, caleCss){
    if(!caleCss){

        let numeFisExt=path.basename(caleScss); // "folder1/folder2/a.scss" -> "a.scss"
        let numeFis=numeFisExt.split(".")[0]   /// "a.scss"  -> ["a","scss"]
        caleCss=numeFis+".css"; // output: a.css
    }
    
    if (!path.isAbsolute(caleScss))
        caleScss=path.join(obGlobal.folderScss,caleScss )
    if (!path.isAbsolute(caleCss))
        caleCss=path.join(obGlobal.folderCss,caleCss )
    
    let caleBackup=path.join(obGlobal.folderBackup, "resurse/CSS");
    if (!fs.existsSync(caleBackup)) {
        fs.mkdirSync(caleBackup,{recursive:true})
    }
    
    // la acest punct avem cai absolute in caleScss si  caleCss

    let numeFisCss=path.basename(caleCss);
    if (fs.existsSync(caleCss)){
        fs.copyFileSync(caleCss, path.join(obGlobal.folderBackup, "resurse/CSS",numeFisCss ))// +(new Date()).getTime()
    }
    rez=sass.compile(caleScss, {"sourceMap":true});
    fs.writeFileSync(caleCss,rez.css)
    
}


//la pornirea serverului
vFisiere=fs.readdirSync(obGlobal.folderScss);
for( let numeFis of vFisiere ){
    if (path.extname(numeFis)==".scss"){
        compileazaScss(numeFis);
    }
}


fs.watch(obGlobal.folderScss, function(eveniment, numeFis){
    if (eveniment=="change" || eveniment=="rename"){
        let caleCompleta=path.join(obGlobal.folderScss, numeFis);
        if (fs.existsSync(caleCompleta)){
            compileazaScss(caleCompleta);
        }
    }
})

app.get("/api/produse-filtrate", async (req, res) => {
    try {
        let { nume, pret_min, greutate, culoare, cheie1, cheie2, ordine } = req.query;
        let queryText = "SELECT id, nume, pret, tip_replica, bile, culoare FROM replici WHERE 1=1";
        let queryParams = [];
        let placeholderIdx = 1;

        if (nume && nume.trim() !== "") {
            queryText += ` AND LOWER(nume) LIKE $${placeholderIdx}`;
            queryParams.push(`%${nume.trim().toLowerCase()}%`);
            placeholderIdx++;
        }

        if (pret_min && !isNaN(parseFloat(pret_min))) {
            queryText += ` AND pret >= $${placeholderIdx}`;
            queryParams.push(parseFloat(pret_min));
            placeholderIdx++;
        }

        if (greutate && greutate !== "toate") {
            // Dacă coloana ta din BD se numește greutate_bila, schimbă aici
            queryText += ` AND bile = $${placeholderIdx}`; 
            queryParams.push(parseFloat(greutate));
            placeholderIdx++;
        }

        if (culoare && culoare !== "toate") {
            // Folosim sintaxa PostgreSQL ANY() pentru a căuta într-un array
            queryText += ` AND $${placeholderIdx} = ANY(culoare)`;
            queryParams.push(culoare);
            placeholderIdx++;
        }

        // 5. Sortare dinamică după 2 chei
        const mapChei = { 
            "nume": "nume", 
            "pret": "pret", 
            "categorie": "tip_replica" 
        };
        
        let col1 = mapChei[cheie1] || "nume";
        let col2 = mapChei[cheie2] || "pret";
        let directie = ordine === "-1" ? "DESC" : "ASC";

        queryText += ` ORDER BY ${col1} ${directie}, ${col2} ${directie}`;

        const { rows } = await client.query(queryText, queryParams);
        res.json(rows);
    } catch (err) {
        console.error("Eroare filtrare server:", err);
        res.status(500).json({ error: "Eroare internă de server." });
    }
});


app.get("/*pagina", function(req, res){
    console.log("Cale pagina", req.url);
    if (req.url.startsWith("/resurse") && path.extname(req.url)==""){
        afisareEroare(res,403);
        return;
    }
    if (path.extname(req.url)==".ejs"){
        afisareEroare(res,400);
        return;
    }
    try{
        res.render("pagini"+req.url, function(err, rezRandare){
            if (err){
                if (err.message.includes("Failed to lookup view")){
                    afisareEroare(res,404)
                }
                else{
                    afisareEroare(res);
                }
            }
            else{
                res.send(rezRandare);
            }
        });
    }
    catch(err){
        if (err.message.includes("Cannot find module")){
            afisareEroare(res,404)
        }
        else{
            afisareEroare(res);
        }
    }
});

app.listen(8080);
console.log("Serverul e live, my R word!");