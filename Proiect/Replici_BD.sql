DROP TYPE IF EXISTS Tip_arma;
DROP TYPE IF EXISTS Metode;
DROP TYPE IF EXISTS Stil;
DROP TYPE IF EXISTS Dimensiune;


CREATE TYPE Tip_arma AS ENUM('SMG', 'DMR', 'Sniper', 'Shotgun', 'LMG', 'Pistol', 'AR', 'Necategorizabil');
CREATE TYPE Metode AS ENUM('CO2', 'Electric', 'Gaz Verde', 'Manual');
CREATE TYPE Stil AS ENUM('Politist', 'Modern', 'Wild West', 'WW2', 'WW1', 'Militar', 'Clasic');
CREATE TYPE Dimensiune AS ENUM('0.10', '0.15', '0.20', '0.25', '0.30', '0.35', '???');


CREATE TABLE IF NOT EXISTS replici (
   id serial PRIMARY KEY,
   nume VARCHAR(50) UNIQUE NOT NULL,
   descriere TEXT,
   pret NUMERIC(8,2) NOT NULL,
   forta INT NOT NULL CHECK (forta>=0),   
   tip_replica Tip_arma DEFAULT 'Necategorizabil',
   culoare VARCHAR(50)[] NOT NULL,
   stil Stil DEFAULT 'Clasic',
   reincarcare Metode default 'Manual',
   imagine VARCHAR(300),
   data_adaugare TIMESTAMP DEFAULT current_timestamp,
   dimensiune_magazin int not null check (dimensiune_magazin > 0),
   atasament_friendly Bool not null,
   bile Dimensiune default '0.25'
);

INSERT into replici (nume,descriere,pret,forta,tip_replica,culoare,stil,reincarcare,imagine,dimensiune_magazin,atasament_friendly,bile) VALUES 
('G36', 'Carabiniera replica Heckler & Koch', 200.99 , 200, 'AR', '{"Negru"}', 'Militar', 'CO2', 'G36.jpg', 60, True, '0.25'),
('USP', 'Pistol replica Heckler & Koch', 134.99 , 110, 'Pistol', '{"Negru", "Beige"}', 'Clasic', 'Manual', 'USP.jpg', 25, True, '0.20'),
('AWP', 'Un sniper pentru cei pasionati de camuflaj (si CS)', 453.99 , 300, 'Sniper', '{"Verde"}', 'Militar', 'CO2', 'AWP.jpg', 10, True, '0.30'),
('M4A4', 'Carabiniera clasica americana', 235.99 , 210, 'AR', '{"Negru", "Alb"}', 'Politist', 'Electric', 'M4A4.jpg', 55, True, '0.25'),
('KAR-98', 'O arma de distanta, pentru cei pasionati de istorie', 643.99 , 250, 'Sniper', '{"Maro"}', 'WW2', 'CO2', 'KAR-98.jpg', 5, False, '0.25'),
('Ithaca-357', 'Shotgun Italian, una dintre cele mai bune Shotgun-uri din punct de vedere estetic', 262.99 , 170, 'Shotgun', '{"Gri", "Argintiu"}', 'Politist', 'Manual', 'Ithaca-357.jpg', 15, False, '0.25'),
('CZ Scorpion EVO 3', 'Un SMG, mai rar auzit', 333.99 , 220, 'SMG', '{"Negru"}', 'Modern', 'Gaz Verde', 'CZ_SCORPIO.jpg', 45, True, '0.15'),
('M249', 'Pentru atunci cand trebuie sa "stergi" o zona', 520.99 , 250, 'LMG', '{"Negru"}', 'Militar', 'Electric', 'M249.jpg', 300, True, '0.25'),
('RPK', 'Kalishnikova, dar LMG', 467.99 , 245, 'LMG', '{"Negru", "Maro"}', 'Militar', 'CO2', 'RPK.jpg', 250, True, '0.30'),
('Colt Python', 'Revolver, pentru atunci cand vrei sa te duelezi cu cineva, sau cand ti s-a stricat arma principala', 177.99 , 190, 'Pistol', '{"Argintiu"}', 'Wild West', 'Manual', 'ColtPython.jpg', 17, False, '0.20'),
('FN Scar 20', 'Carabiniera Scar, dar pentru o distanta mai mare', 278.99 , 205, 'DMR', '{"Galben", "Maro"}', 'Clasic', 'Electric', 'Scar20.jpg', 40, True, '0.35'),
('Derringer', 'Nu vad niciun motiv pentru care asta ai folosi ca arma principala', 110.99 , 120, 'Pistol', '{"Bronz", "Auriu"}', 'Wild West', 'Manual', 'Derringer.jpg', 4, False, '0.30'),
('M2 Flamethrower', 'O arma cu apa, dar e replica de airosft', 421.99 , 70, 'Necategorizabil', '{"Gri"}', 'WW2', 'Electric', 'Flamenwherfer.jpg', 2, False, '???'),
('M1 Garand', 'Pentru iubitorii de WW1', 243.99 , 235, 'DMR', '{"Maro"}', 'WW1', 'Gaz Verde', 'M1Garand.jpg', '10', False, '0.15'),
('M134', 'Pentru atunci cand NU VREI sa dai inamicului vreun avantaj', 899.99 , 350, 'Necategorizabil', '{"Alb"}', 'Clasic', 'CO2', 'M134.jpg', 800, True, '0.10'),
('VSS Vintorez', 'Pentru atunci cand vrei sa tii distanta, in liniste', 433.99 , 240, 'DMR', '{"Negru", "Maro"}', 'Modern', 'CO2', 'VSS.jpg', 35, False, '0.15'),
('Thompson', 'Cunoscut si ca "Chicago Typewriter"', 420.99 , 200, 'SMG', '{"Gri", "Maro", "Argintiu"}', 'WW1', 'Electric', 'Thompson.jpg', 50, False, '0.25'),
('Remington 870', 'Un shogun pump-action', 321.99 , 185, 'Shotgun', '{"Gri"}', 'Politist', 'Manual', 'Remmington870.jpg', 20, True, '0.25');