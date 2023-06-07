import express from 'express';

const app = express();

app.get('/', (req, res) => {
   res.send('Hello World!');
}
);

app.get('/listings', (req, res) => {
   res.send('Listings!');
}
);

app.post('/list', (req, res) => {
   res.send('List!');
}
);

app.post('place-bid', (req, res) => {
   res.send('Place Bid!');
}
);

app.post('buy', (req, res) => {
   res.send('Buy!');
}
);



app.listen(3000, () => {
   console.log('Example app listening on port 3000!');
}
);