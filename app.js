const express = require("express");
const app = express();

const fs = require("fs");
const csv = require("json2csv");
const moment = require("moment");
const multer = require("multer");
const archiver = require("archiver");

require("moment-timezone");
moment.tz.setDefault("Asia/Seoul");

app.set("view engine", "ejs");
app.set("views", "./views");

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));
app.use(express.static("data"));
app.use(express.static("public"));

const upload = multer({
	dest: "public/"
});

app.get("/", (req, res) => {
	fs.readdir("data/", (err, files) => {
		if (err) res.status(500).send({ result: false });
		fs.readdir("public/", (err, files2) => {
			if (err) res.status(500).send({ result: false });
			res.render("index", {
				files,
				files2
			});
		});
	});
});
app.get("/upload", (req, res) => {
	res.render("upload");
});
app.get("/delete/:dir/:filename", (req, res) => {
	fs.unlink(`${req.params.dir}/${req.params.filename}`, err => {
		if (err) res.status(500).send({ result: false });
		res.redirect("/");
	});
});
app.post("/save", (req, res) => {
	var regData = req.body.data;
	if (req.body.label && regData) {
		var data = [];
		console.log(regData);
		try {
			fs.mkdirSync("data");
		} catch (e) {
			if (e.code != "EEXIST") throw e;
		}
		var dateStr = moment().format("YYYY-MM-DDTHH-mm-ss");
		dateStr = dateStr.replace(/:/gi, "-") + "__" + req.body.label;
		for (let i = 0; i < regData[Object.keys(regData)[0]].length; i++) {
			let tmp = {};
			Object.keys(regData).map(key => {
				tmp[key] = regData[key][i];
			});
			data.push(tmp);
		}
		data[0].label = req.body.label;
		fs.writeFile(`data/${dateStr}.csv`, csv.parse(data), err => {
			if (err) {
				console.log("FAIL");
				res.status(500)
					.send({ result: false, message: "저장 중 에러" })
					.end();
			}
			console.log("CLEAR");
			res.status(200)
				.send({ result: true, message: "성공" })
				.end();
		});
	} else {
		res.status(400)
			.send({ result: false, message: "잘못된 요청" })
			.end();
	}
});

app.post("/filesave", upload.single("file"), (req, res) => {
	var file = req.file;
	if (file) {
		console.log(file);
		res.send({
			originalName: file.originalname,
			size: file.size
		});
	} else {
		res.status(400).send({
			result: false,
			message: "잘못된 요청"
		});
	}
});
app.get("/downloadAll", (req, res) => {
	var archive = archiver("zip", {
		zlib: { level: 9 } // Sets the compression level.
	});
    var output = fs.createWriteStream("public/data.zip");
	output.on("close", function() {
        archive.end();
        output.end();
		res.sendfile("./public/data.zip");
	});
	output.on("close", function() {
        console.log("DownloadAll")
	});
	archive.on("error", function(err) {
		throw err;
	});
	archive.pipe(output);
	archive.directory("data/", false);
	archive.finalize();
});
app.listen(3000);
