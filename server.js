const express = require('express');
const app = express();
const PORT = 3000;

// Serve static files from the 'public' folder
app.use(express.static('public'));

app.listen(PORT, () => {
    console.log(`DevToolkit running at http://localhost:${PORT}`);
});