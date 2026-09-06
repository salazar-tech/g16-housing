const DRIVE_FOLDER_ID = 'PEGA_AQUI_EL_ID_DE_LA_CARPETA_DE_DRIVE';
const TEMPLATE_DOCUMENT_ID = 'PEGA_AQUI_EL_ID_DEL_DOCUMENTO_PLANTILLA';

const LANDLORD = {
  name: 'REEMPLAZAR EN APPS SCRIPT',
  nationality: 'REEMPLAZAR EN APPS SCRIPT',
  dni: 'REEMPLAZAR EN APPS SCRIPT',
  address: 'REEMPLAZAR EN APPS SCRIPT',
  email: 'REEMPLAZAR EN APPS SCRIPT',
  phone: 'REEMPLAZAR EN APPS SCRIPT'
};

function doPost(e) {
  try {
    let data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseError) {
        data = {};
      }
    }

    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const fileName = sanitizeFileName(data.fileName || 'contrato-hospedaje');
    
    const copiedFile = DriveApp
      .getFileById(TEMPLATE_DOCUMENT_ID)
      .makeCopy(fileName.replace(/\.pdf$/i, ''), folder);
      
    const document = DocumentApp.openById(copiedFile.getId());
    const values = buildTemplateValues(data);

    replaceTokensInBody(document.getBody(), values);
    if (document.getHeader()) replaceTokensInBody(document.getHeader(), values);
    if (document.getFooter()) replaceTokensInBody(document.getFooter(), values);
    
    document.saveAndClose();

    return jsonResponse({
      ok: true,
      fileId: copiedFile.getId(),
      fileUrl: copiedFile.getUrl()
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error.message
    });
  }
}

function doGet() {
  return jsonResponse({
    ok: true,
    message: 'Google Apps Script activo.'
  });
}

function buildTemplateValues(data) {
  const guest = data.guest || {};
  const contract = data.contract || {};

  return {
    '{{landlordName}}': LANDLORD.name,
    '{{landlordNationality}}': LANDLORD.nationality,
    '{{landlordDni}}': LANDLORD.dni,
    '{{landlordAddress}}': LANDLORD.address,
    '{{landlordEmail}}': LANDLORD.email,
    '{{landlordPhone}}': LANDLORD.phone,
    '{{dateDay}}': contract.day,
    '{{dateMonth}}': contract.month,
    '{{dateYear}}': contract.year,
    '{{guestName}}': guest.name,
    '{{guestNationality}}': guest.nationality,
    '{{guestDni}}': guest.dni,
    '{{guestAddress}}': guest.address,
    '{{guestEmail}}': guest.email,
    '{{guestPhone}}': guest.phone,
    '{{startDate}}': contract.startDate,
    '{{endDate}}': contract.endDate,
    '{{rentWords}}': contract.rentWords,
    '{{rentAmount}}': contract.rentAmount,
    '{{paymentDay}}': contract.paymentDay,
    '{{depositWords}}': contract.depositWords,
    '{{depositAmount}}': contract.depositAmount
  };
}

function replaceTokensInBody(container, values) {
  Object.keys(values).forEach(function(token) {
    const replacement = values[token] == null ? '' : String(values[token]);
    const pattern = token.replace(/[{}]/g, '\\$&');
    container.replaceText(pattern, replacement);
  });
}

function sanitizeFileName(fileName) {
  return fileName.replace(/[\\/:*?"<>|]/g, '-');
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function testDoPost() {
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        fileName: 'contrato-test',
        guest: {
          name: 'Juan Pérez',
          nationality: 'Peruana',
          dni: '12345678',
          address: 'Av. Principal 123',
          email: 'juan@example.com',
          phone: '987654321'
        },
        contract: {
          day: '05',
          month: 'Septiembre',
          year: '2026',
          startDate: '05/09/2026',
          endDate: '05/09/2027',
          rentWords: 'Un mil soles',
          rentAmount: '1000',
          paymentDay: '05',
          depositWords: 'Un mil soles',
          depositAmount: '1000'
        }
      })
    }
  };

  const response = doPost(mockEvent);
  Logger.log(response.getContent());
}

function updateTemplateToCamelCase() {
  const doc = DocumentApp.openById(TEMPLATE_DOCUMENT_ID);
  const body = doc.getBody();

  const replacements = {
    '{{DATE_DAY}}': '{{dateDay}}',
    '{{DATE_MONTH}}': '{{dateMonth}}',
    '{{DATE_YEAR}}': '{{dateYear}}',
    '{{LANLORD_NAME}}': '{{landlordName}}',
    '{{LANDLORD_NAME}}': '{{landlordName}}',
    '{{LANDLORD_NATIONALITY}}': '{{landlordNationality}}',
    '{{LANDLORD_DNI}}': '{{landlordDni}}',
    '{{LANDLORD_ADDRESS}}': '{{landlordAddress}}',
    '{{LANDLORD_EMAIL}}': '{{landlordEmail}}',
    '{{LANDLORD_PHONE}}': '{{landlordPhone}}',
    '{{GUEST_NAME}}': '{{guestName}}',
    '{{GUEST_NATIONALITY}}': '{{guestNationality}}',
    '{{GUEST_DNI}}': '{{guestDni}}',
    '{{GUEST_ADDRESS}}': '{{guestAddress}}',
    '{{GUEST_EMAIL}}': '{{guestEmail}}',
    '{{GUEST_PHONE}}': '{{guestPhone}}',
    '{{START_DATE}}': '{{startDate}}',
    '{{END_DATE}}': '{{endDate}}',
    '{{RENT_WORDS}}': '{{rentWords}}',
    '{{RENT_AMOUNT}}': '{{rentAmount}}',
    '{{PAYMENT_DAY}}': '{{paymentDay}}',
    '{{DEPOSIT_WORDS}}': '{{depositWords}}',
    '{{DEPOSIT_AMOUNT}}': '{{depositAmount}}'
  };

  Object.keys(replacements).forEach(function(oldToken) {
    body.replaceText(oldToken.replace(/[{}]/g, '\\$&'), replacements[oldToken]);
  });

  doc.saveAndClose();
  Logger.log('Template document updated successfully to camelCase!');
}