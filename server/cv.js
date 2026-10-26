// Extraction du texte d'un CV (PDF, DOCX ou texte).
import mammoth from "mammoth";
// Import direct du module : l'index de pdf-parse lance un fichier de test au chargement.
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export async function extractText(file) {
  const name = file.originalname.toLowerCase();
  let text;
  if (name.endsWith(".pdf")) text = (await pdfParse(file.buffer)).text;
  else if (name.endsWith(".docx")) text = (await mammoth.extractRawText({ buffer: file.buffer })).value;
  else if (/\.(txt|md)$/.test(name)) text = file.buffer.toString("utf8");
  else throw new Error("Format non pris en charge. Utilisez un PDF, un DOCX ou un fichier texte.");
  text = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (text.length < 40) throw new Error("Peu de texte trouvé dans le fichier (CV scanné en image ?). Collez le texte à la place.");
  return text;
}
