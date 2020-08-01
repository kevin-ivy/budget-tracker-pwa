//Create variable to hold db connection
let db;

//establish a connection to IndexedDB database
const request = indexedDB.open('budget_tracker', 1);

//Emit if the database version changes
request.onupgradeneeded = function(event) {
    //save reference to database
    const db = event.target.result;
    //create object store called new_transaction
    db.createObjectStore('new_transaction', {autoIncrement: true});
};

//if successful
request.onsuccess = function(event) {
    db = event.target.result;

    //check if app is online, if yes, runuploadTransaction()
    if (navigator.onLine) {
        uploadTransction();
    }
};

request.onerror = function(event) {
    //log error here
    console.log(event.target.errorCode);
};

//Execute function if there's no connection and a new transaction is attempted
function saveRecord(record) {
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    //access the object store for 'new_transaction'
    const budgetObjectStore = transaction.objectStore('new_transaction');

    //add record to your store
    budgetObjectStore.add(record);
};

function uploadTransaction()  {
    //open a transaction on db
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    //acess object store
    const budgetObjectStore = transaction.objectStore('new_transaction');

    //Get all records from store and set to variable
    const getAll = budgetObjectStore.getAll();

    //after successflly getALl(), run function
    getAll.onsuccess = function() {
        //if there was data in the store, send it to api server
        if (getAll.result.length > 0) {
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
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    //open another transaction
                    const transaction = db.transaction(['new_transaction'], 'readwrite');
                    //access the new_transaction object store
                    const budgetObjectStore = transaction.objectStore('new_transaction');
                    //clear all items in store
                    budgetObjectStore.clear();

                    alert('All saved transactions have been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
}

//listen for app coming back online
window.addEventListener('online', uploadTransaction);