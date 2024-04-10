import fs from "fs";
import path from "path";
import cheerio from "cheerio";

/**
 * フォルダ配下のファイルプルパスの配列取得
 * @param folderPath 対象のフォルダ
 * @returns string[] フォルダ配下のファイルプルパスの配列
 */
const readSubDirSync = (folderPath) => {
  let result = [];
  const readTopDirSync = (folderPath) => {
    let items = fs.readdirSync(folderPath);
    items = items.map((itemName) => {
      return path.join(folderPath, itemName);
    });
    items.forEach((itemPath) => {
      result.push(itemPath);
      if (fs.statSync(itemPath).isDirectory()) {
        readTopDirSync(itemPath);
        //再帰処理
      }
    });
  };
  readTopDirSync(folderPath);
  return result;
};

/**
 * 対象HTMLファイルの情報取得
 * @param filePath 対象のHTMLファイルパス
 * @returns ファイルパス、title、description、keywords、ogImage、h1のオブジェクト
 */
const getHtmlInfo = (filePath) => {
  // HTMLファイルを読み込み
  const html = fs.readFileSync(filePath, "utf-8");
  // ファイルパス、title、description、keywords、ogImage、h1のオブジェクトを取得
  const $ = cheerio.load(html);
  const title = $("title").text();
  const description = $('meta[name="description"]').attr("content");
  const keywords = $('meta[name="keywords"]').attr("content");
  const ogImage = $('meta[property="og:image"]').attr("content");
  const h1 = $("h1").html();

  const obj = {
    path: filePath,
    title: title || "-",
    description: description || "-",
    keywords: keywords || "-",
    ogImage: ogImage || "-",
    h1: h1 || "-",
  };
  return obj;
};

/**
 * フォルダ配下のHTML情報取得
 * @param folderPath 対象のフォルダパス
 * @returns ファイルパス、title、description、keywords、ogImage、h1のオブジェクトの配列
 */
const getHtmlInfos = (folderPath) => {
  // HTMLファイルのみのパス配列取得
  const filePaths = readSubDirSync(folderPath);
  const htmlFilePattern = /.html$/i;
  const htmlFilePaths = filePaths.filter((filePath) =>
    htmlFilePattern.test(filePath)
  );
  const htmlInfos = htmlFilePaths.map((htmlFilePath) => {
    return getHtmlInfo(htmlFilePath);
  });
  return htmlInfos;
};

/**
 * 配列をCSV形式の文字列に変換
 * @param array Objectの配列
 * @returns CSV形式の文字列
 */
const convertToCsv = (array) => {
  // Objectの Key を headerとして取り出す
  let str =
    `${Object.keys(array[0])
      .map((value) => `"${value}"`)
      .join(",")}` + "\r\n";

  // 各オブジェクトの値をCSVの行として追加する
  return array.reduce((str, next) => {
    str +=
      `${Object.values(next)
        .map((value) => `"${value}"`)
        .join(",")}` + "\r\n";
    return str;
  }, str);
};

// 処理実行
(() => {
  const SRC_DIR = "./sample";
  const OUT_DIR = "./output";
  const htmlInfos = getHtmlInfos(SRC_DIR);
  const csvData = convertToCsv(htmlInfos);
  const date = new Date();
  const fileName = `data_${date.getTime()}.csv`;
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }
  fs.writeFileSync(`${OUT_DIR}/${fileName}`, csvData);
})();
