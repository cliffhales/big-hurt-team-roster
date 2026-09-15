const SPREADSHEET_ID = "1YDxNmTdm-qpF7_O8qN0AKdqN1iLiYqeW5s_IAPZ1N0g";
const SHEET_NAME = "Roster Submissions";
const HEADERS = [
  "Timestamp", "Team Name", "Team Captain", "Team Town", "Non-Racers", "Team Number",
  "Mountain Bike Name", "Mountain Bike Town", "Mountain Bike Emergency Name", "Mountain Bike Emergency Phone",
  "Kayak Name", "Kayak Town", "Kayak Emergency Name", "Kayak Emergency Phone",
  "Road Bike Name", "Road Bike Town", "Road Bike Emergency Name", "Road Bike Emergency Phone",
  "Run Name", "Run Town", "Run Emergency Name", "Run Emergency Phone",
];
const LEGACY_HEADERS = [
  "Timestamp", "Team Name", "Team Captain", "Team Town", "Non-Racers",
  "Mountain Bike Name", "Mountain Bike Town", "Mountain Bike Email", "Mountain Bike Emergency Name", "Mountain Bike Emergency Phone",
  "Kayak Name", "Kayak Town", "Kayak Email", "Kayak Emergency Name", "Kayak Emergency Phone",
  "Road Bike Name", "Road Bike Town", "Road Bike Email", "Road Bike Emergency Name", "Road Bike Emergency Phone",
  "Run Name", "Run Town", "Run Email", "Run Emergency Name", "Run Emergency Phone",
];
const ROW_KEYS = [
  "teamName", "teamCaptain", "teamTown", "nonRacers",
  "mountainBike-name", "mountainBike-town", "mountainBike-emergencyName", "mountainBike-emergencyPhone",
  "kayak-name", "kayak-town", "kayak-emergencyName", "kayak-emergencyPhone",
  "roadBike-name", "roadBike-town", "roadBike-emergencyName", "roadBike-emergencyPhone",
  "run-name", "run-town", "run-emergencyName", "run-emergencyPhone",
];

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    const expectedSecret = PropertiesService.getScriptProperties().getProperty("SUBMISSION_SECRET");
    if (!expectedSecret || body.secret !== expectedSecret) return respond({ ok: false, error: "Unauthorized." });
    if (!body.row || typeof body.row !== "object") return respond({ ok: false, error: "Missing roster row." });

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) return respond({ ok: false, error: `Sheet tab not found: ${SHEET_NAME}` });
    ensureHeaders(sheet);

    // Team Number is intentionally blank on submission. Race staff assigns it later.
    const values = [
      new Date(),
      ...ROW_KEYS.slice(0, 4).map((key) => body.row[key] ?? ""),
      "",
      ...ROW_KEYS.slice(4).map((key) => body.row[key] ?? ""),
    ];
    sheet.appendRow(values);
    return respond({ ok: true });
  } catch (error) {
    return respond({ ok: false, error: error.message || "Unexpected spreadsheet error." });
  }
}

function ensureHeaders(sheet) {
  const existingWidth = Math.max(sheet.getLastColumn(), LEGACY_HEADERS.length);
  const range = sheet.getRange(1, 1, 1, existingWidth);
  const existing = range.getValues()[0].slice(0, LEGACY_HEADERS.length);
  if (existing.every((value) => value === "")) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  } else if (existing.every((value, index) => value === LEGACY_HEADERS[index])) {
    [23, 18, 13, 8].forEach((column) => sheet.deleteColumn(column));
    sheet.insertColumnAfter(5);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  } else if (!HEADERS.every((value, index) => existing[index] === value)) {
    throw new Error("The first row does not match the expected roster headers.");
  }
}

function onEdit(e) {
  const sheet = e && e.range && e.range.getSheet();
  if (!sheet || sheet.getName() !== SHEET_NAME || e.range.getRow() === 1) return;

  const headers = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const teamNumberColumn = headers.indexOf("Team Number") + 1;
  const teamNameColumn = headers.indexOf("Team Name") + 1;
  if (!teamNumberColumn || !teamNameColumn || e.range.getColumn() !== teamNumberColumn) return;

  const teamNumber = String(e.range.getValue()).trim();
  const teamName = String(sheet.getRange(e.range.getRow(), teamNameColumn).getValue()).trim().toLowerCase();
  if (!teamNumber || !teamName) return;

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  const rows = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  rows.forEach((row, index) => {
    const sameTeam = String(row[teamNameColumn - 1]).trim().toLowerCase() === teamName;
    const numberIsBlank = String(row[teamNumberColumn - 1]).trim() === "";
    if (sameTeam && numberIsBlank) sheet.getRange(index + 2, teamNumberColumn).setValue(teamNumber);
  });
}

function respond(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
