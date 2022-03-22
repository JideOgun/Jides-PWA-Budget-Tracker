// creating variable to hold the db connection
let db;

// establishing connection to IndexDB database called budget_tracker, set to versioin 1
const request = indexedDB.open("budget_tracker", 1);

request.onupgradeneeded = function (event) {
  // save a reference to the database
  const db = event.target.result;
  // creating an object store called `new_budget`, setting it to have an auto incrementing primary key
  db.createObjectStore("new_budget", { autoIncrement: true });
};

request.onsuccess = function (event) {
  // when db is successfully created with its object store(from upgradeneeded) or simnply established connection, save reference to db in gloabl variable
  db = event.target.result;
  // check if app is online, if yes run uploadBudget() function to send all local db data to api
  if (navigator.onLine) {
    uploadBudget();
  }
};
request.onerror = function (event) {
  console.log(event.target.errorcode);
};

// this function will be executed if we attempt to submit a new transaction and there's no internet connection
function saveRecord(record) {
  //
  const transaction = db.transaction(["new_budget"], "readwrite");

  // access the object store for new_budget
  const budgetObjectStore = transaction.objectStore("new_budget");
  // adding the record to the store with the add method
  budgetObjectStore.add(record);
}

const uploadBudget = () => {
    // opening a transation to the db
    const transaction = db.transaction(["new_budget"], "readwrite");
    //  accessing the object store
    const budgetObjectStore = transaction.objectStore("new_budget")
    // getting all records from store and saving to a variable
    const getAll = budgetObjectStore.getAll();
    // upon successful .getAll() execution, run this function
    getAll.onsuccess = function() {
        // if there was data in indexedDb's store, lets send it to the api server
        if(getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if(serverResponse.message) {
                    throw new Error(serverResponse)
                }

                // open one more transaction
                const transaction = db.transaction(["new_budget"], 'readwrite');
                // access the new budget object store
                const budgetObjectStore = transaction.objectStore("new_budget");
                // clear all the items in the store
                budgetObjectStore.clear();

                alert('All saved transactions have been submitted!')
            })
            .catch(err => {
                console.log(err);
              });
        }
    }



}

// listen for app coming back online
window.addEventListener('online', uploadBudget);
