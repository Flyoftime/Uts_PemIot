const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const app = express();
const PORT = 3000;

app.use(cors({
    origin: 'http://127.0.0.1:5500' 
}));

// Set up the database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'tb_cuaca'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to the database.');
});

app.get('/data', (req, res) => {
    // Query 1: Get max, min, and average temperature
    const query1 = `
        SELECT 
            MAX(suhu) AS suhumax,
            MIN(suhu) AS suhumin,
            AVG(suhu) AS suhurata
        FROM tb_cuaca;
    `;
    
    db.query(query1, (err, results1) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ error: 'Error fetching data in Query 1' });
            return;
        }

        // Query 2: Get records with max temperature and humidity
        const query2 = `
            SELECT id AS idx, suhu, humid, lux AS kecerahan, ts AS timestamp FROM tb_cuaca 
            WHERE suhu = (SELECT MAX(suhu) FROM tb_cuaca) 
            AND humid = (SELECT MAX(humid) FROM tb_cuaca);
        `;

        db.query(query2, (err, results2) => {
            if (err) {
                console.error('Error fetching data:', err);
                res.status(500).json({ error: 'Error fetching data in Query 2' });
                return;
            }

            // Query 3: Get unique month-year for max temperature and humidity
            const query3 = `
                SELECT DISTINCT DATE_FORMAT(ts, '%m-%Y') AS month_year 
                FROM tb_cuaca 
                WHERE suhu = (SELECT MAX(suhu) FROM tb_cuaca) 
                AND humid = (SELECT MAX(humid) FROM tb_cuaca);
            `;

            db.query(query3, (err, results3) => {
                if (err) {
                    console.error('Error fetching data:', err);
                    res.status(500).json({ error: 'Error fetching data in Query 3' });
                    return;
                }

                // Combine results and send response
                const data = {
                    suhumax: results1[0].suhumax,
                    suhumin: results1[0].suhumin,
                    suhurata: results1[0].suhurata,
                    nilai_suhu_max_humid_max: results2,
                    month_year_max: results3.map(row => ({ month_year: row.month_year }))
                };

                res.json(data);
            });
        });
    });
});


app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
