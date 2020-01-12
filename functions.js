function displayError(message) {
  var pre = document.getElementById('error');
  var textContent = document.createTextNode(message + '\n');
  pre.appendChild(textContent);
}

function createRowObject(row){
  let rowObject = {
    entryId: new Date(row[0]).getTime(),
    submittedOn: new Date(row[0]),
    name: row[1],
    phone: row[2],
    numberCats: row[3],
    email: row[4],
    address: row[5],
    catLocation: row[6],
    kittenAdults: row[7],
    areCatsInside: row[8],
    willMakeDonation: row[9],
    catDescription: row[10],
    isCatFriendly: row[11],
    isCatInjured: row[12],
    whereCatFound: row[13],
    otherInfo: row[14],
    intakeStatus: row[15],
    catsToSixMonths: row[16],
    catsInCarrier: row[17],
    canHoldCat: row[18],
    canPetCat: row[19],
    catNeedTrapped: row[20],
    catsThreeToEight: row[21],
    catsToThree: row[22],
    catsOverEight: row[23],
    needBottleFed: row[24],
    catInjuredDetails: row[25],
    isCatFriendly: row[26],
    //image upload entry row[28]
    county: row[27],
    comments: [],
    images: [],
    sheetIndex: 0
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

  //start counting at '2' since the first non-header row of Google sheet is at index 2
  let rowCounter = 2;
  sheetData.forEach(row => {
    let newRow = createRowObject(row);
    newRow.sheetIndex = rowCounter;
    rowDataObjectArray.push(newRow);

    rowCounter++;
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

function updateStatus(status){
    console.log(currentRowData);

    // updateSheetCell("something", "P2:P2")
    // updateSheetRow(currentRowData,2)
}

function updateSheetCell(updateData, updateRange) {
  gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: '1pFovhJ2zqoRvjsHiAwa5OIrYLnRXAMtlAcVXoxacp8E',
    range: updateRange,
    valueInputOption: 'RAW'
  }, {values: [[updateData]]}).then(function(response) {
      console.log(response);

  }, function(err) {
      console.log(err)
    // displayError('Error: ' + response.result.error.message);
  });
}

function updateSheetRow(updateData, updateRange){
    console.log(updateData)
    let updateValues = [{
        range: "A4",
        values: [["1","2", "3", "4", "5"]]      
    }]
    gapi.client.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: '1pFovhJ2zqoRvjsHiAwa5OIrYLnRXAMtlAcVXoxacp8E',
        valueInputOption: 'RAW'
        }, {'data': updateValues, }).then(function(response) {
          console.log(response);

    }, function(err) {
          console.log(err)
    // displayError('Error: ' + response.result.error.message);
    });
}

//modal

function openMoreModal(buttonInfo){
  let rowData = getRowData(buttonInfo.id);

  if(rowData == []){
    //return error
  }
  else{
    currentRowData = rowData;
    $('#detailsModal').modal('show')
  }
}

//on modal show
$('#detailsModal').on('show.bs.modal', function (event) {
  var modal = $(this)
  modal.find('#contactName').val(currentRowData.name)
  modal.find('#contactAddress').val(currentRowData.address)
  modal.find('#contactEmail').val(currentRowData.email)
  modal.find('#contactPhone').val(currentRowData.phone)
  modal.find('#contactDescription').val(currentRowData.catDescription)
  modal.find('#commentButton').attr("entryid", new Date(currentRowData.submittedOn).getTime())
  $('#moreInfoContainer').hide();

  //get comments
  if(currentRowData.comments.length > 0){
    currentRowData.comments.forEach(comment => {
      modal.find('#comments').append('<p>'+ comment[0] + '<br>' + comment[2] + '<br>' + comment[1] + '</p>')
    })
  }
  else{
     modal.find('#comments').append('<p> No comments yet </p>');
  }

  //get images
  if(currentRowData.images.length > 0){
    currentRowData.images.forEach(image => {
      modal.find('#modalImages').append('<img src="https://drive.google.com/uc?export=view&id=' + image + '" style="width: 100%; height:250px; color:#eceeef" class="col-lg-6">')
    })
  }
  else{
     modal.find('#modalImages').append('<p> No images yet </p>');
  }

})

//when modal hide
$('#detailsModal').on('hidden.bs.modal', function (event) {
  var modal = $(this)
  modal.find('#comments').empty();
  modal.find('#modalImages').empty();
  $('.formInput').prop("readonly", true);
  $('#moreInfoContainer').hide();
})

function addComment(buttonInfo){
    $('#detailsModal').modal('hide');
    let entryId = $(buttonInfo).attr('entryid');
    let formURL = `https://docs.google.com/forms/d/e/1FAIpQLScHrPaJZRFApyxnuTUZQNcq_ujKCaxnUIwHe0QXaOkWb0FYiQ/viewform?usp=pp_url&entry.498511043=${entryId}`;
    window.open(formURL,'_blank');
}

function toggleMoreInfo(){
    if($('#moreInfoButton')[0].innerText == "Show More"){
        $('#moreInfoContainer').show();
        $('#moreInfoButton').text("Show Less");
    }
    else{
        $('#moreInfoContainer').hide();
        $('#moreInfoButton').text("Show More");
    }
}

function editForm(){
    
    if($('#editContactButton')[0].innerText == "Edit"){
        $('.formInput').prop('readonly', false);
        $('#editContactButton').text("Cancel Edit");
    }
    else{
        $('.formInput').prop('readonly', true);
        $('#editContactButton').text("Edit");
    }
}

