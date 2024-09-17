const app = require("./app");
const config = require("./config/config");


const PORT = config.PORT || 3000;

app.listen(
	PORT,
	console.log(
		`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
	)
);