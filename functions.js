const intakeSheetName = "Sheet1";


function displayError(message) {
  var pre = document.getElementById('error');
  var textContent = document.createTextNode(message + '\n');
  pre.appendChild(textContent);
}

function createRowObject(headers, row){
  let rowObject = {};
  for (let i= 0; i < row.length; i++) {
    rowObject[headers[i]] = row[i];
  }
  if (!rowObject['Intake Status']) {
    rowObject['Intake Status'] = 'new';
    headers.push('Intake Status')
  }
  if (!rowObject['Timestamp']) {
    rowObject['entryId'] = new Date(rowObject['Submitted On']).getTime();
    rowObject['submittedOn'] = new Date(rowObject['Submitted On']);
  } else {
    rowObject['entryId'] = new Date(rowObject['Timestamp']).getTime();
    rowObject['submittedOn'] = new Date(rowObject['Timestamp']);
  }
  rowObject['comments'] = [];
  rowObject['images'] = [];
  rowObject['headers'] = headers;
  // rowObject['headers'].shift();

  return rowObject;
}

function getSheetData() {
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: intakeSheetId,
    range: intakeSheetName,
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
    if(row.length > 0){
      let newRow = createRowObject(headers, row);
      newRow.sheetIndex = rowCounter;
      rowDataObjectArray.push(newRow);
    }

    rowCounter++;
  })

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

      let index = 2;
      range.values.forEach(comment => {

        let rowEntry = sheetData.find(x => x.entryId == comment[4]);
        if(rowEntry){
          comment.sheetIndex = index;
          rowEntry.comments.push(comment);
        }
        index++;
      })
    }
    getImageData(sheetData)
  }, function(response) {
    displayError('Error: ' + response.result.error.message);
    getImageData(sheetData)
  });
}

function getImageData(sheetData){
  sheetData.forEach(row => {
            let imageURLs = row['Please provide any pictures of the cat(s)'];
            if (imageURLs) {
              imageURLs.split(", ").forEach(url => {
                let split = url.split("https://drive.google.com/open?id=");
                row.images.push(split[1])
              })
            }
  })
  //form data for handlebars
  readyHandlebars(sheetData);
}


function readyHandlebars(data){

  let groupedByStatus = _.groupBy(data, function(entry){
    return entry['Intake Status']
  });

  var newEntrySource = document.getElementById("newEntryDataTemplate").innerHTML;
  var newEntryTemplate = Handlebars.compile(newEntrySource);
  var newEntryData = { newEntryData: groupedByStatus["new"]};
  var newEntryOutput = newEntryTemplate(newEntryData);
  document.getElementById("newEntryData").innerHTML = newEntryOutput;

  var needInfoSource = document.getElementById("needInfoDataTemplate").innerHTML;
  var needInfoTemplate = Handlebars.compile(needInfoSource);
  var needInfoData = { needsInfoData: groupedByStatus["needsInfo"]};
  var needInfoOutput = needInfoTemplate(needInfoData);
  document.getElementById("needInfoData").innerHTML = needInfoOutput;

  var completedSource = document.getElementById("completedDataTemplate").innerHTML;
  var completedTemplate = Handlebars.compile(completedSource);
  var completedData = { completedData: groupedByStatus["completed"]};
  var completedOutput = completedTemplate(completedData);
  document.getElementById("completedData").innerHTML = completedOutput;

  let urlParams = new URLSearchParams(window.location.search);
  let myParam = urlParams.get('tab');
  $('#navTab a[href="#'+myParam+'Entries"]').tab('show')
}

function getRowData(id){
  currentRowData = null; //clear row
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

function openMoreModal(buttonInfo, isCompleted){
  let rowData = getRowData(buttonInfo.id);

  if(rowData == []){
    //return error
  }
  else{
    currentRowData = rowData;
    $('#detailsModal').modal({show: true})
  }
}

//on modal show
$('#detailsModal').on('show.bs.modal', function (event) {
  var modal = $(this);
  for (let detail in currentRowData) {
    if (!["sheetIndex", "images", "comments", "entryId", "Intake Status",
          "Please provide any pictures of the cat(s)", "headers"].includes(detail)) {
      let element = `
              <div class="form-group">
                <label for="{detail}">${detail}</label>
                <input type="text" class="form-control formInput" name="${detail}" id="${detail}" value="${currentRowData[detail]}"readonly>
              </div>`
      modal.find('#infoForm').replace(element);
    }
  }

  $('#moreInfoContainer').hide();
  $('#saveContactButton').hide();
  $('#formMessage').hide()
  $('#commentFormContainer').hide()

  if(currentRowData.intakeStatus == "completed"){
    $('#editContactButton').hide();
    $('#imageButton').hide();
    $('#commentButton').hide();
    $('#deleteButton').show();
  }
  else{
    $('#editContactButton').show();
    $('#imageButton').show();
    $('#commentButton').show();
    $('#deleteButton').hide();
  }

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
      $('#commentMessage').text("Comment saved successfully.");
      $("#commentMessage").show().delay(8000).queue(function (next) {
        $(this).hide();
        next();
        });
      cancelComment();
      getSheetData();

  }, function(err) {
        cancelComment();
        $('#commentMessage').text("An error occurred, nothing was saved, please try again.")
        $("#commentMessage").show().delay(8000).queue(function (next) {
          $(this).hide();
          next();
          });
  });
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
  currentRowData["headers"].forEach(header => {
    if (formDataObj[header] || formDataObj[header] == "") {
      formDataArray.push(formDataObj[header])
    } else {
      formDataArray.push(currentRowData[header])
    }
  })

  let updateRange = `B${currentRowData.sheetIndex}`
  console.log(formDataArray);
  console.log(updateRange);
  updateSheetRow(formDataArray, updateRange)

}

//delete entries
function deleteComments(){

  let rangesToDelete = currentRowData.comments.map(row => {
    return `A${row.sheetIndex}:ZZ${row.sheetIndex}`;
  });

  gapi.client.sheets.spreadsheets.values.batchClear({
    spreadsheetId: commentSheetId,
  }, { ranges: rangesToDelete}).then(function(response) {
     console.log(response);

  }, function(err) {
      console.log(err)
  });
}

function deleteImages(){
  currentRowData.images.forEach(image => {
    gapi.client.drive.files.delete({
    'fileId': image
  }).then(function(response){
    console.log(response)
  }, function(err){
    console.log(err);
    errors.push(err);
  });
  })

  //deletes the entry from the image sheet, make sure all images are deleted first
  // let rangesToDelete = currentRowData.imageSheetIndexes.map(index => {
  //   return `A${index}:ZZ${index}`;
  // });

  // gapi.client.sheets.spreadsheets.values.batchClear({
  //   spreadsheetId: imageSheetId,
  // }, { ranges: rangesToDelete}).then(function(response) {
  //    console.log(response);

  // }, function(err) {
  //     console.log(err)
  // });
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






