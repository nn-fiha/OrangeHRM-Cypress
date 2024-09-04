
const { faker } = require('@faker-js/faker');
describe('OrangeHRM End to End Testing', () => {
  const adminUserName = "Admin"
  const adminPassword = "admin123"
  const employeeDataFile = "employeeData.json" 
  function generateRandomPassword() {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const symbols = '!@#$%^&*()_+';
    
    let password = '';
    for (let i = 0; i < 2; i++) {
        password += upper.charAt(Math.floor(Math.random() * upper.length));
        password += lower.charAt(Math.floor(Math.random() * lower.length));
        password += digits.charAt(Math.floor(Math.random() * digits.length));
        password += symbols.charAt(Math.floor(Math.random() * symbols.length));
    }
    
    return password;
}
  function generateEmployeeId() {
    return Math.floor(1000 + Math.random() * 9000); 
  }


  before(() => {

   //Login as Admin
    cy.visit('/');
    cy.title().should("eq", "OrangeHRM")
    cy.get("input[name='username'").type(adminUserName)
    cy.get("input[name='password'").type(adminPassword)
    cy.get("[type='submit']").click()
  });

  it('Validate the whole OrangeHRM flow', () => {
    cy.waitTillVisible('h6')
    cy.get('h6').should("have.text", "Dashboard")
    cy.get("span").contains("PIM").click()
    cy.get("button[type='button']").contains("Add").click()
    cy.waitTillVisible('h6')


    //Create a New Employee
    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();
    const fullName = firstName+" "+lastName
    const employeeId = generateEmployeeId();
    const username = firstName + lastName
    const password = generateRandomPassword()
    cy.get("input[name='firstName'").type(firstName);
    cy.get("input[name='lastName']").type(lastName);
    cy.get("input[type='checkbox']").click({ force: true });
    cy.get('label').contains("Employee Id").parent().siblings('div').find('input').clear();
    cy.get('label').contains("Employee Id").parent().siblings('div').find('input').type(employeeId);
    cy.get('label').contains("Username").parent().siblings('div').find('input').type(username);
    cy.get('label').contains("Password").parent().siblings('div').find('input').type(password);
    cy.get('label').contains("Confirm Password").parent().siblings('div').find('input').type(password);
    cy.get("button[type='submit']").click()
  
    cy.get('.oxd-text--toast-message').should("have.text", "Successfully Saved")
    cy.waitTillVisible('h6')
    cy.get('h6').should("contain.text", fullName)

    cy.writeFile(`cypress/fixtures/${employeeDataFile}`,{
      username,
      password,
      employeeId
    });

    //Search by Employee ID

    cy.get("span").contains("PIM").click()
    cy.get('.oxd-topbar-body-nav-tab-item').contains("Employee List").click()
    cy.waitTillVisible("h5")
    cy.get('label').contains("Employee Id").parent().siblings('div').find('input').type(employeeId);
    cy.get("button[type='submit']").click()
    cy.get(".oxd-table-card > .oxd-table-row > :nth-child(2) > div").contains(employeeId).should('exist'); 


    //Search in Directory by Employee Name

    cy.get("span").contains("Directory").click()
    cy.waitTillVisible("h5")
    cy.get("input[placeholder='Type for hints...']").type(firstName)
    cy.get('.oxd-autocomplete-option > span').click()
    cy.get("button[type='submit']").click()

    cy.get(".orangehrm-directory-card-header")
      .invoke('text')
      .then((text) => {
        const normalizedText = text.replace(/\s+/g, ' ').trim(); 
        expect(normalizedText).to.eq(fullName);
      });

     // Log out from the admin session.

      cy.get("span img").click()
      cy.get("li a").contains("Logout").click()
      cy.waitTillVisible("h5")


      // Login with New Employee Credentials

      cy.fixture(employeeDataFile).then((employee)=>{
       
        cy.get("input[name='username'").type(employee.username)
        cy.get("input[name='password'").type(employee.password)
        cy.get("[type='submit']").click()
        cy.get("p.oxd-userdropdown-name").should("have.text",fullName)
      })

      // Update My Info
      // Scroll down and select Gender

      cy.get("span").contains("My Info").click()
      cy.get('.--gender-grouped-field').scrollIntoView();
      cy.get('label').contains('Female').find("input[type='radio']").click({ force: true })
      cy.get('h6').contains("Personal Details").parent().find("button[type='submit']").click()
      cy.get('.oxd-text--toast-message').should("have.text", "Successfully Updated")
      cy.waitTillVisible('h6')
  
      // Scroll down and select Blood Type as O+.

      cy.get('.orangehrm-custom-fields').scrollIntoView();
      cy.get('label').contains("Blood Type").parent('div').siblings('div').find('.oxd-select-text--arrow').click()
      cy.get('label').contains("Blood Type").parent('div').siblings('div').find("div[role='listbox']").contains("O+").click()
      cy.get('h6').contains("Custom Fields").parent().find("button[type='submit']").click()
      cy.get('.oxd-text--toast-message').should("have.text", "Successfully Updated")
      cy.waitTillVisible('h6')
    
  })

  after(() => {
    // Log Out As Newly Created Employee.
    cy.get("span img").click()
    cy.get("li a").contains("Logout").click()
    cy.waitTillVisible("h5")
    // clear employeedata object after all tests are completed
    cy.writeFile(`cypress/fixtures/${employeeDataFile}`,{});
  });
})
