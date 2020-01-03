// Client ID and API key from the Developer Console
var CLIENT_ID = '928340435199-8lk3ff00m9iuh4pte7c4tq3g836qusc9.apps.googleusercontent.com';
var API_KEY = 'AIzaSyDJ425Inkn_BByboYV5OacRdybj2jE-pBo';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

var authorizeButton = document.getElementById('authorize_button');
var signoutButton = document.getElementById('signout_button');
var unauthorizedBlock= document.getElementById('unauthorizedBlock');
var authorizedBlock= document.getElementById('authorizedBlock');

let globalSheetData = {};
let currentRowData = [];


/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function () {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
    signoutButton.onclick = handleSignoutClick;

  }, function(error) {
    displayError(JSON.stringify(error, null, 2));
  });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    unauthorizedBlock.style.display = "none";
    authorizedBlock.style.display = "block";
    getSheetData();
  } else {
    unauthorizedBlock.style.display = "block";
    authorizedBlock.style.display = "none";
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
  $( "#catData" ).empty();
}

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in pre element.
 */
function displayError(message) {
  var pre = document.getElementById('error');
  var textContent = document.createTextNode(message + '\n');
  pre.appendChild(textContent);
}

function parseSheetData(response){

  let headers = response.values[0];
  response.values.shift();
  let sheetData = response.values;
  // globalSheetData = sheetData;

  // var source = document.getElementById("catDataTemplate").innerHTML;
  // var template = Handlebars.compile(source);
  // var data = { sheetData: sheetData, headers: headers};

  let rowDataObjectArray = [];
  sheetData.forEach(row => {
    rowDataObjectArray.push(createRowObject(row));
  })
  var data = { sheetData: rowDataObjectArray};
  globalSheetData = rowDataObjectArray;
  getCommentData(data);

  // var output = template(data);
  // document.getElementById("catData").innerHTML = output;
}

function createRowObject(row){
  let rowObject = {
    entryId: new Date(row[1]).getTime(),
    submittedOn: new Date(row[1]),
    name: row[2],
    phone: row[3],
    numberCats: row[4],
    email: row[5],
    address: row[6],
    catLocation: row[7],
    kittenAdults: row[8],
    areCatsInside: row[9],
    willMakeDonation: row[10],
    catDescription: row[11],
    isCatFriendly: row[12],
    isCatInjured: row[13],
    whereCatFound: row[14],
    otherInfo: row[15],
    intakeStatus: row[16],
    catsToSixMonths: row[17],
    catsInCarrier: row[18],
    canHoldCat: row[19],
    canPetCat: row[20],
    catNeedTrapped: row[21],
    catsThreeToEight: row[22],
    catsToThree: row[23],
    catsOverEight: row[24],
    needBottleFed: row[25],
    catInjuredDetails: row[26],
    isCatFriendly: row[27],
    //image upload entry row[28]
    county: row[29],
    comments: []
  }
  return rowObject;
}

function getSheetData() {
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: '1pFovhJ2zqoRvjsHiAwa5OIrYLnRXAMtlAcVXoxacp8E',
    range: 'Sheet1',
  }).then(function(response) {
    var range = response.result;
    if (range.values.length > 0) {
      parseSheetData(range);
    } else {
      displayError('No data found.');
    }
  }, function(response) {
    displayError('Error: ' + response.result.error.message);
  });
}

function getCommentData(sheetData){
  var source = document.getElementById("catDataTemplate").innerHTML;
  var template = Handlebars.compile(source);
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: '1RwiQ3sI31swWW-oATinxsaGiCuhK4vfMzZoe-CnJZ1Q',
    range: 'Form Responses 1',
  }).then(function(response) {
    var range = response.result;
    if (range.values.length > 0) {
console.log(sheetData.sheetData)
      range.values.forEach(comment => {
        
        let rowEntry = sheetData.sheetData.find(x => x.entryId == comment[4]);
        if(rowEntry){
          rowEntry.comments.push(comment);
        }
      })
    }

    var output = template(sheetData);
    document.getElementById("catData").innerHTML = output;
  }, function(response) {
    displayError('Error: ' + response.result.error.message);   
    var output = template(sheetData);
    document.getElementById("catData").innerHTML = output;
  });
}

function getRowData(id){
  let row = [];
  //get all ids from global sheet data

  let rowEntry = globalSheetData.find(x => x.entryId == id);
  // globalSheetData.forEach(sheetRow => {
  //   if(new Date(sheetRow[1]).getTime() == id){
  //     row = sheetRow;
  //   }
  // })
  return rowEntry;
}

function openMoreModal(buttonInfo){
  let rowData = getRowData(buttonInfo.id);

  if(rowData == []){
    //return error
  }
  else{
    //use row data to create modal
    currentRowData = rowData;
    $('#exampleModal').modal('show')
  }
}

function addComment(buttonInfo){
  $('#exampleModal').modal('hide');
  let entryId = $(buttonInfo).attr('entryid');
  let formURL = `https://docs.google.com/forms/d/e/1FAIpQLScHrPaJZRFApyxnuTUZQNcq_ujKCaxnUIwHe0QXaOkWb0FYiQ/viewform?usp=pp_url&entry.498511043=${entryId}`;
  window.open(formURL,'_blank');
}

$('#exampleModal').on('show.bs.modal', function (event) {
  var modal = $(this)
  console.log(currentRowData)
  modal.find('#contactName').text(currentRowData.name)
  modal.find('#contactAddress').text(currentRowData.address)
  modal.find('#contactEmail').text(currentRowData.email)
  modal.find('#contactPhone').text(currentRowData.phone)
  modal.find('#contactDescription').text(currentRowData.catDescription)
  modal.find('#commentButton').attr("entryid", new Date(currentRowData.submittedOn).getTime())
  if(currentRowData.comments.length > 0){
    currentRowData.comments.forEach(comment => {
      modal.find('#comments').append('<p>'+ comment[0] + '<br>' + comment[2] + '<br>' + comment[1] + '</p>')
    })
  }
  else{
     modal.find('#comments').append('<p> No comments </p>');
  }
})

$('#exampleModal').on('hidden.bs.modal', function (event) {
  var modal = $(this)
  modal.find('#comments').empty();
})
