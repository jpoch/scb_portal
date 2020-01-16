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
    catInjuredDetails: row[25], //duplicate?
    isCatFriendlyDupe: row[26], //duplicate?
    //image upload entry row[27]
    county: row[28],
    comments: [],
    images: [],
    sheetIndex: 0
  }
  return rowObject;
}

function getSheetData() {
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: intakeSheetId,
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
  getCommentData(rowDataObjectArray);
}

function getCommentData(sheetData){
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: commentSheetId,
    range: 'Form Responses 1',
  }).then(function(response) {
    var range = response.result;
    if (range.values.length > 0) {
      range.values.shift(); //remove headers from data

      range.values.forEach(comment => {
        
        let rowEntry = sheetData.find(x => x.entryId == comment[4]);
        if(rowEntry){
          rowEntry.comments.push(comment);
        }
      })
    }
    getImageData(sheetData)
  }, function(response) {
    displayError('Error: ' + response.result.error.message);   
    getImageData(sheetData)
  });
}

function getImageData(sheetData){
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: imageSheetId,
    range: 'Form Responses 1',
  }).then(function(response) {
    var range = response.result;
    if (range.values.length > 0) {
      range.values.forEach(imageRow => {
        
        let rowEntry = sheetData.find(x => x.entryId == imageRow[3]);
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
    //form data for handlebars
    readyHandlebars(sheetData);

  }, function(response) {
    displayError('Error: ' + response.result.error.message); 
    readyHandlebars(sheetData); 
  });
}



function readyHandlebars(data){

  let groupedByStatus = _.groupBy(data, function(entry){ 
    return entry.intakeStatus
  });

  var newEntrySource = document.getElementById("newEntryDataTemplate").innerHTML;
  var newEntryTemplate = Handlebars.compile(newEntrySource);
  var newEntryData = { newEntryData: groupedByStatus[""]};
  var newEntryOutput = newEntryTemplate(newEntryData);
  document.getElementById("newEntryData").innerHTML = newEntryOutput;

  var needInfoSource = document.getElementById("needInfoDataTemplate").innerHTML;
  var needInfoTemplate = Handlebars.compile(needInfoSource);
  var needInfoData = { needsInfoData: groupedByStatus["needsInfo"]};
  var needInfoOutput = needInfoTemplate(needInfoData);
  document.getElementById("needInfoData").innerHTML = needInfoOutput;
}

function getRowData(id){
  let row = [];
  let rowEntry = globalSheetData.find(x => x.entryId == id);
  return rowEntry;
}


//used only for update form at the moment
function updateSheetRow(updateData, updateRange){
  let updateValues = [{
      range: updateRange,
      values: [updateData]      
  }]
  gapi.client.sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: intakeSheetId,
      valueInputOption: 'RAW'
      }, {'data': updateValues, }).then(function(response) {
        $('#formMessage').text("Save successful")
        $("#formMessage").show().delay(8000).queue(function (next) {
            $(this).hide();
            next();
        });
        $('#saveContactButton').hide();
        $('.formInput').prop("readonly", true);
        $('.formDropdown').prop("disabled", true);
        $('#editContactButton').text("Edit");
        getSheetData()

  }, function(err) {
      $('#formMessage').text("An error occurred, nothing was saved, please try again.")
      $("#formMessage").show().delay(8000).queue(function (next) {
          $(this).hide();
          next();
      });
      $('#saveContactButton').hide();
      $('.formInput').prop("readonly", true);
      $('.formDropdown').prop("disabled", true);
      $('#editContactButton').text("Edit");
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
  modal.find('#numberOfCats').val(currentRowData.numberCats)
  modal.find('#locationOfCats').val(currentRowData.catLocation)
  modal.find('#intakeStatus').val(currentRowData.intakeStatus)
  modal.find('#contactDescription').val(currentRowData.catDescription)
  modal.find('#kittenAdults').val(currentRowData.kittenAdults)
  modal.find('#isCatInside').val(currentRowData.areCatsInside)
  modal.find('#makeDonation').val(currentRowData.willMakeDonation)
  modal.find('#catFriendly').val(currentRowData.isCatFriendly)
  modal.find('#catInjury').val(currentRowData.isCatInjured)
  modal.find('#catFound').val(currentRowData.whereCatFound)
  modal.find('#otherInfo').val(currentRowData.otherInfo)
  modal.find('#catSixMonths').val(currentRowData.catsToSixMonths)
  modal.find('#catThreeYrs').val(currentRowData.catsToThree)
  modal.find('#catEightYrs').val(currentRowData.catsThreeToEight)
  modal.find('#catTrapped').val(currentRowData.catNeedTrapped)
  modal.find('#bottleFed').val(currentRowData.needBottleFed)
  modal.find('#catOverEight').val(currentRowData.catsOverEight)
  modal.find('#catCarrier').val(currentRowData.catsInCarrier)
  modal.find('#holdCat').val(currentRowData.canHoldCat)
  modal.find('#petCat').val(currentRowData.canPetCat)
  modal.find('#contactCounty').val(currentRowData.county)


  modal.find('#commentButton').attr("entryid", currentRowData.entryId)
  modal.find('#imageButton').attr("entryid", currentRowData.entryId)
  $('#moreInfoContainer').hide();
  $('#saveContactButton').hide();
  $('#formMessage').hide()
  $('#commentFormContainer').hide()

  //get comments
  if(currentRowData.comments.length > 0){
    currentRowData.comments.forEach(comment => {
      modal.find('#comments').append('<p>'+ comment[0] + '<br>' + comment[2] + '<br> --' + comment[1] + '</p>')
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
  $('.formDropdown').prop("disabled", true);
  $('#moreInfoButton').text("Show More");
  $('#editContactButton').text("Edit");
  $('#saveContactButton').hide();
  $('#moreInfoContainer').hide();
  $('#formMessage').hide()
  $('#commentFormContainer').hide()
  $('#commentUserName').val("");
  $('#commentContent').val("");
})

function addComment(){
  $('#commentFormContainer').show();
  $('#commentButton').hide();
}

function cancelComment(){
  $('#commentUserName').val("");
  $('#commentContent').val("");
  $('#commentFormContainer').hide();
  $('#commentButton').show();
}

function saveComment(){

  let formData = $('#commentForm').serializeArray();

  let formDataObj = {}
  formData.forEach(entry => {
    formDataObj[entry.name] = entry.value;
  })

  let formDataArray = [];
  formDataArray.push(new Date().toLocaleString());
  formDataArray.push(formDataObj.commentUserName);
  formDataArray.push(formDataObj.commentContent);
  formDataArray.push(""); //empty for now, need to change sheet
  formDataArray.push(currentRowData.entryId);

  gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: commentSheetId,
    valueInputOption: 'RAW',
    range: 'A1'
    }, {'values': [formDataArray], }).then(function(response) {
      $('#commentMessage').text("Comment saved successfully.")
      $("#commentMessage").show().delay(8000).queue(function (next) {
        $(this).hide();
        next();
        });
      cancelComment();
      getSheetData()

  }, function(err) {
        cancelComment();
        $('#commentMessage').text("An error occurred, nothing was saved, please try again.")
        $("#commentMessage").show().delay(8000).queue(function (next) {
          $(this).hide();
          next();
          });
  });
}

function addImage(buttonInfo){
    console.log(buttonInfo)
    $('#detailsModal').modal('hide');
    let entryId = $(buttonInfo).attr('entryid');
    let formURL = `https://docs.google.com/forms/d/e/1FAIpQLSfq8mcVfhB-Kp4FO_6NYqdWAxERFmFYjjx1r55U21gP67eZLA/viewform?usp=pp_url&entry.1716461802=${entryId}`;
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
        $( "#detailsModal" ).scrollTop( 0 );
    }
}

function editForm(){  
    if($('#editContactButton')[0].innerText == "Edit"){
        $('.formInput').prop('readonly', false);
        $('.formDropdown').prop('disabled', false);
        $('#editContactButton').text("Cancel Edit");
        $('#saveContactButton').show();
    }
    else{
        $('.formInput').prop('readonly', true);
        $('.formDropdown').prop('disabled', true);
        $('#editContactButton').text("Edit");
        $('#saveContactButton').hide();
    }
}

function saveForm(){
  let formData = $('#infoForm').serializeArray();

  let formDataObj = {}
  formData.forEach(entry => {
    formDataObj[entry.name] = entry.value;
  })

  let formDataArray = [];
  formDataArray.push(formDataObj.contactName);
  formDataArray.push(formDataObj.contactPhone);
  formDataArray.push(formDataObj.numberOfCats);
  formDataArray.push(formDataObj.contactEmail);
  formDataArray.push(formDataObj.contactAddress);
  formDataArray.push(formDataObj.locationOfCats);
  formDataArray.push(formDataObj.kittenAdults);
  formDataArray.push(formDataObj.isCatInside);
  formDataArray.push(formDataObj.makeDonation);
  formDataArray.push(formDataObj.contactDescription);
  formDataArray.push(formDataObj.catFriendly);
  formDataArray.push(formDataObj.catInjury);
  formDataArray.push(formDataObj.catFound);
  formDataArray.push(formDataObj.otherInfo);
  formDataArray.push(formDataObj.intakeStatus);
  formDataArray.push(formDataObj.catSixMonths);
  formDataArray.push(formDataObj.catCarrier);
  formDataArray.push(formDataObj.holdCat);
  formDataArray.push(formDataObj.petCat);
  formDataArray.push(formDataObj.catTrapped); //not yet
  formDataArray.push(formDataObj.catEightYrs);
  formDataArray.push(formDataObj.catThreeYrs);
  formDataArray.push(formDataObj.catOverEight);
  formDataArray.push(formDataObj.bottleFed);
  formDataArray.push(formDataObj.catInjury); //duplicate?
  formDataArray.push(formDataObj.catFriendly); //duplicate?
  formDataArray.push(""); //submit picture
  formDataArray.push(formDataObj.contactCounty);

  let updateRange = `B${currentRowData.sheetIndex}`
  updateSheetRow(formDataArray, updateRange)

}


//unused but could be useful later
// function updateSheetCell(updateData, updateRange) {
//   gapi.client.sheets.spreadsheets.values.update({
//     spreadsheetId: '1pFovhJ2zqoRvjsHiAwa5OIrYLnRXAMtlAcVXoxacp8E',
//     range: updateRange,
//     valueInputOption: 'RAW'
//   }, {values: [[updateData]]}).then(function(response) {
//       console.log(response);

//   }, function(err) {
//       console.log(err)
//     // displayError('Error: ' + response.result.error.message);
//   });
// }

// function updateEntryComments(entryId){
//   gapi.client.sheets.spreadsheets.values.get({
//     spreadsheetId: '1RwiQ3sI31swWW-oATinxsaGiCuhK4vfMzZoe-CnJZ1Q',
//     range: 'Form Responses 1',
//   }).then(function(response) {
//     var range = response.result;
//     if (range.values.length > 0) {
//       range.values.shift(); //remove headers from data
//       currentRowData.comments = [];
//       range.values.forEach(comment => {
//         if(comment[4] == entryId){
//           currentRowData.comments.push(comment)
//         }
//       })


//       $('#detailsModal').modal('hide');
//       $('#detailsModal').modal('show');

//       // console.log(currentRowData.comments)
//       // currentRowData.comments.forEach(comment => {
//       // $('#comments').append('<p>'+ comment[0] + '<br>' + comment[2] + '<br>' + comment[1] + '</p>')
//       // })
//     }
//   }, function(response) {
//     console.log(response) 
//   });
// }





