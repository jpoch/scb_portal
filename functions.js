function displayError(message) {
  var pre = document.getElementById('error');
  var textContent = document.createTextNode(message + '\n');
  pre.appendChild(textContent);
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
    comments: [],
    images: []
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

function parseSheetData(response){
  let headers = response.values[0];
  response.values.shift();
  let sheetData = response.values;

  let rowDataObjectArray = [];
  sheetData.forEach(row => {
    rowDataObjectArray.push(createRowObject(row));
  })
  var data = { sheetData: rowDataObjectArray};
  globalSheetData = rowDataObjectArray;
  getCommentData(data);
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
      range.values.forEach(comment => {
        
        let rowEntry = sheetData.sheetData.find(x => x.entryId == comment[4]);
        if(rowEntry){
          rowEntry.comments.push(comment);
        }
      })
    }
    getImageData(sheetData)
    // var output = template(sheetData);
    // document.getElementById("catData").innerHTML = output;
  }, function(response) {
    displayError('Error: ' + response.result.error.message);   
    // var output = template(sheetData);
    // document.getElementById("catData").innerHTML = output;
    getImageData(sheetData)
  });
}

function getImageData(sheetData){
  var source = document.getElementById("catDataTemplate").innerHTML;
  var template = Handlebars.compile(source);
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: '1TaK5AWMTVVvOOKllQalohjol9oJOm83up85IKFe3XjM',
    range: 'Form Responses 1',
  }).then(function(response) {
    var range = response.result;
    if (range.values.length > 0) {
      range.values.forEach(imageRow => {
        
        let rowEntry = sheetData.sheetData.find(x => x.entryId == imageRow[3]);
        if(rowEntry){
            let imageURLs = imageRow[1].split(", ");
            let urls = [];
            imageURLs.forEach(url => {
                let split = url.split("https://drive.google.com/open?id=");
                urls.push(split[1])
            })
            rowEntry.images = urls
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
  let rowEntry = globalSheetData.find(x => x.entryId == id);
  return rowEntry;
}



//modal

function openMoreModal(buttonInfo){
  let rowData = getRowData(buttonInfo.id);

  if(rowData == []){
    //return error
  }
  else{
    currentRowData = rowData;
    $('#exampleModal').modal('show')
  }
}

$('#exampleModal').on('show.bs.modal', function (event) {
  var modal = $(this)
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
     modal.find('#comments').append('<p> No comments yet </p>');
  }

  if(currentRowData.images.length > 0){
    currentRowData.images.forEach(image => {
      modal.find('#modalImages').append('<img src="https://drive.google.com/uc?export=view&id=' + image + '" style="width: 100%; height:250px; color:#eceeef" class="col-lg-6">')
    })
  }
  else{
     modal.find('#modalImages').append('<p> No images yet </p>');
  }
})

$('#exampleModal').on('hidden.bs.modal', function (event) {
  var modal = $(this)
  modal.find('#comments').empty();
  modal.find('#modalImages').empty();
})

function addComment(buttonInfo){
    $('#exampleModal').modal('hide');
    let entryId = $(buttonInfo).attr('entryid');
    let formURL = `https://docs.google.com/forms/d/e/1FAIpQLScHrPaJZRFApyxnuTUZQNcq_ujKCaxnUIwHe0QXaOkWb0FYiQ/viewform?usp=pp_url&entry.498511043=${entryId}`;
    window.open(formURL,'_blank');
}
