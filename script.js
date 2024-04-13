let inventory = [];

/* This code loads inventory data from a database when the window loads. It
is calling a function `loadInventoryFromDB()` which returns a promise that resolves with the
inventory data. Once the promise is resolved, the `updateInventoryTable()` function is called to
update the UI table with the fetched inventory data. */
window.onload = () => {
     loadInventoryFromDB().then(inventory => {
          // Update UI table with the fetched inventory
          updateInventoryTable(inventory);
     });
};

/**
 * The `openIndexedDB` function opens an IndexedDB database named 'inventory_db' with a store named
 * 'inventory' and returns a promise that resolves with the database object.
 * @returns The `openIndexedDB` function returns a Promise.
 */
function openIndexedDB() {
     const dbName = 'inventory_db';
     const storeName = 'inventory';

     return new Promise((resolve, reject) => {
          const request = indexedDB.open(dbName, 1); // Version 1

          request.onsuccess = (event) => {
               console.log('Database opened successfully');
               resolve(event.target.result);
          };

          request.onerror = (event) => {
               console.error('Error opening database:', event.target.error);
               reject(event.target.error);
          };

          request.onupgradeneeded = (event) => {
               const db = event.target.result;
               const store = db.createObjectStore(storeName, {
                    keyPath: 'id'
               });
               store.createIndex('name', 'name', {
                    unique: false
               }); // Optional index for searching
          };
     });
}

/**
 * The `saveInventoryToDB` function saves inventory items to an IndexedDB database.
 */
function saveInventoryToDB() {
     openIndexedDB().then(db => {
          const transaction = db.transaction('inventory', 'readwrite');
          const store = transaction.objectStore('inventory');

          inventory.forEach(item => {
               store.put(item); // Add or update item based on existing ID
          });

          transaction.oncomplete = () => {
               console.log('Inventory saved to IndexedDB successfully');
          };

          transaction.onerror = (event) => {
               console.error('Error saving inventory to IndexedDB:', event.target.error);
          };
     });
}

/**
 * The `loadInventoryFromDB` function retrieves all items from an IndexedDB object store named
 * 'inventory' and updates the UI with the loaded data.
 */
function loadInventoryFromDB() {
     openIndexedDB().then(db => {
          const transaction = db.transaction('inventory', 'readonly');
          const store = transaction.objectStore('inventory');

          const objectRequest = store.getAll(); // Retrieve all items

          objectRequest.onsuccess = (event) => {
               inventory = event.target.result;
               updateInventoryTable(); // Update UI with loaded data
          };

          objectRequest.onerror = (event) => {
               console.error('Error loading inventory from IndexedDB:', event.target.error);
          };
     });
}

/**
 * The `updateInventoryTable` function dynamically updates an HTML table displaying inventory items
 * with options to edit, delete, and restock items.
 */
function updateInventoryTable() {
     const tableBody = document.getElementById('inventory_table').getElementsByTagName('tbody')[0];
     tableBody.innerHTML = '';

     // Creates the html table accordingly
     for (let item of inventory) {
          const tableRow = document.createElement('tr');

          const idCell = document.createElement('td');
          idCell.textContent = item.id;
          tableRow.appendChild(idCell);

          const nameCell = document.createElement('td');
          nameCell.textContent = item.name;

          const editNameButton = document.createElement('button');
          editNameButton.innerHTML = '<ion-icon name="create-outline"></ion-icon>';
          editNameButton.addEventListener('click', () => editItemName(item.name, item.id));
          nameCell.appendChild(editNameButton);

          tableRow.appendChild(nameCell);

          const quantityCell = document.createElement('td');
          quantityCell.textContent = item.quantity;

          const editQuantityButton = document.createElement('button');
          editQuantityButton.innerHTML = '<ion-icon name="create-outline"></ion-icon>';
          editQuantityButton.addEventListener('click', () => editItemQuantity(item.name, item.id));
          quantityCell.appendChild(editQuantityButton);

          tableRow.appendChild(quantityCell);

          const priceCell = document.createElement('td');
          priceCell.textContent = "₱" + item.price.toFixed(2); // Format price with 2 decimal places

          const editPriceButton = document.createElement('button');
          editPriceButton.innerHTML = '<ion-icon name="create-outline"></ion-icon>';
          editPriceButton.addEventListener('click', () => editItemPrice(item.name, item.id));
          priceCell.appendChild(editPriceButton);

          tableRow.appendChild(priceCell);

          const amountCell = document.createElement('td');
          amountCell.textContent = "₱" + (item.quantity * item.price).toFixed(2);
          tableRow.appendChild(amountCell);

          const expireCell = document.createElement('td');
          expireCell.textContent = item.expiration;
          tableRow.appendChild(expireCell);

          const actionsCell = document.createElement('td');

          const deleteButton = document.createElement('button');
          deleteButton.innerHTML = '<ion-icon name="trash-outline"></ion-icon>';
          deleteButton.classList = 'solid-btn delete';
          deleteButton.addEventListener('click', () => deleteItem(item.name));
          actionsCell.appendChild(deleteButton);

          const restockButton = document.createElement('button');
          restockButton.innerHTML = '<ion-icon name="bag-add"></ion-icon>';
          restockButton.classList = 'solid-btn restock';
          restockButton.addEventListener('click', () => restockItem(item.name, item.id));
          actionsCell.appendChild(restockButton);

          tableRow.appendChild(actionsCell);

          tableBody.appendChild(tableRow);
     }
     updateInventorySummary();
}

/**
 * The `updateInventorySummary` function calculates total quantity, total value, spoilage, restock, and
 * unique items in the inventory based on item details and updates the corresponding elements in the
 * HTML document.
 */
function updateInventorySummary() {
     let totalQuantity = 0;
     let totalValue = 0;
     let spoilage = 0;
     let restock = 0;
     const uniqueItems = new Set(inventory.map(item => item.name)).size; // Count unique item names using Set
     const today = new Date(); // Get today's date 
     for (let item of inventory) {
          const expiration = new Date(item.expiration)
          if (expiration.getTime() <= today.getTime()) {
               spoilage += 1;
          }

          totalQuantity += item.quantity;
          totalValue += item.quantity * item.price;
          if (item.quantity < 0) {
               spoilage = Math.abs(item.quantity);
          } else {
               restock = item.quantity;
          }
     }

     document.getElementById('total_inventory').textContent = totalQuantity;
     document.getElementById('total_value').textContent = "₱" + totalValue.toFixed(2); // Format total value with currency symbol and 2 decimal places
     document.getElementById('spoilage').textContent = spoilage;
     document.getElementById('restock').textContent = restock;
     document.getElementById('unique_items').textContent = uniqueItems; // Add unique items to summary
}

/**
 * The `addInventoryItem` function adds a new item to an IndexedDB database after validating that the
 * quantity and price are not negative.
 * @param item - The `item` parameter represents an object that contains information about a new
 * inventory item to be added. It typically has the following structure:
 */
function addInventoryItem(item) {

     // Handling for negative values.
     if (item.quantity < 0) {
          alert("Quantity cannot be negative. Please enter a positive value.");
     } else if (item.price < 0) {
          alert("Price cannot be negative. Please enter a positive value.");
     } else {

          openIndexedDB().then(db => {
               const transaction = db.transaction('inventory', 'readwrite');
               const store = transaction.objectStore('inventory');

               store.add(item); // Add the new item with a unique ID

               transaction.oncomplete = () => {
                    console.log('Item added to IndexedDB successfully');
                    inventory.push(item); // Update in-memory inventory for immediate UI update
                    updateInventoryTable(); // Update UI with the new item
               };

               transaction.onerror = (event) => {
                    console.error('Error adding item to IndexedDB:', event.target.error);
               };
          });
     }
}

/**
 * The `deleteInventoryItem` function deletes an item from an IndexedDB object store based on the
 * provided itemID and updates the UI accordingly.
 * @param itemID - The `itemID` parameter in the `deleteInventoryItem` function represents the unique
 * identifier of the inventory item that you want to delete from the IndexedDB. This identifier is used
 * to locate and remove the specific item from the database.
 */
function deleteInventoryItem(itemID) {
     openIndexedDB().then(db => {
          const transaction = db.transaction('inventory', 'readwrite');
          const store = transaction.objectStore('inventory');

          let deleteRequest = store.delete(itemID); // Add the new item with a unique ID
          deleteRequest.onsuccess = function (event) {
               console.log("Object deleted successfully!");
          };

          deleteRequest.onerror = function (event) {
               console.error("Error deleting object:", event.target.error);
          };
          transaction.oncomplete = () => {
               console.log('Item deleted from IndexedDB successfully');
               updateInventoryTable(); // Update UI with the new item
          };
          transaction.onerror = (event) => {
               console.error('Error adding item to IndexedDB:', event.target.error);
          };
     });
};


/**
 * The `deleteItem` function removes an item from the inventory, updates the inventory table, and logs an error if the item is not found.
 * @param itemName - The `itemName` parameter is the name of the item that you want to delete from the
 * inventory. The function `deleteItem` searches for this item in the `inventory` array based on its
 * name and then removes it if found.
 */
function deleteItem(itemName) {
     const itemIndex = inventory.findIndex(item => item.name === itemName);

     if (itemIndex !== -1) {
          const item = inventory[itemIndex]; // Access item only if found
          inventory.splice(itemIndex, 1);
          updateInventoryTable();
          deleteInventoryItem(item.id); // Passes to the `deleteInventoryItem` function
          saveInventoryToDB();
     } else {
          console.error("Item not found:", itemName); // Handle item not found case
     }
};

/**
 * The `editItemName` function updates the name of an item in an IndexedDB store and updates the UI
 * accordingly.
 * @param itemName - The `itemName` parameter in the `editItemName` function represents the name of the
 * item you want to edit in the inventory.
 * @param itemID - The `itemID` parameter is the unique identifier of the item in the IndexedDB that
 * you want to edit. It is used to locate the specific item in the database for updating its name.
 */
function editItemName(itemName, itemID) {
     openIndexedDB().then(db => {
          const transaction = db.transaction('inventory', 'readwrite');
          const store = transaction.objectStore('inventory');

          let getRequest = store.get(itemID);

          const itemIndex = inventory.findIndex(item => item.name === itemName);

          let newItemName;
          if (itemIndex !== -1) {
               newItemName = prompt("Enter new item name:", itemName);
               if (newItemName && newItemName !== itemName) { // Check if name has changed
                    inventory[itemIndex].name = newItemName;
                    updateInventoryTable();
               }
          }
          let deleteRequest = store.delete(itemID); // Add the new item with a unique ID
          getRequest.onsuccess = function (event) {
               const item = event.target.result;
               if (item) {
                    item.name = newItemName; // Update quantity

                    // Put the updated object back in the store
                    let putRequest = store.put(item);
                    putRequest.onsuccess = function (event) {
                         console.log("Object updated successfully!");
                    };
                    putRequest.onerror = function (event) {
                         console.error("Error updating object:", event.target.error);
                    };
               } else {
                    console.error("Item not found:", itemID);
               }

               deleteRequest.onsuccess = function (event) {
                    console.log("Object deleted successfully!");
               };
               deleteRequest.onerror = function (event) {
                    console.error("Error deleting object:", event.target.error);
               };
               transaction.oncomplete = () => {
                    console.log('Item deleted from IndexedDB successfully');
                    updateInventoryTable(); // Update UI with the new item
               };
               transaction.onerror = (event) => {
                    console.error('Error adding item to IndexedDB:', event.target.error);
               };
          }
     });
}

/**
 * The `editItemQuantity` function updates the quantity of an item in an IndexedDB store based on user
 * input and then updates the UI accordingly.
 * @param itemName - The `itemName` parameter represents the name of the item you want to edit the
 * quantity for in the inventory. It is used to identify the item in the inventory array and in the
 * IndexedDB store.
 * @param itemID - The `itemID` parameter is used to uniquely identify the item in the IndexedDB. It is
 * used to retrieve the item from the database, update its quantity, and then delete the old item
 * before adding the updated item back to the database.
 */
function editItemQuantity(itemName, itemID) {
     openIndexedDB().then(db => {
          const transaction = db.transaction('inventory', 'readwrite');
          const store = transaction.objectStore('inventory');

          let getRequest = store.get(itemID);

          const itemIndex = inventory.findIndex(item => item.name === itemName);
          let newQuantity;
          if (itemIndex !== -1) {

               do {
                    newQuantity = parseInt(prompt("Enter new quantity:", inventory[itemIndex].quantity));
                    if (newQuantity < 0) {
                         alert("Quantity cannot be negative. Please enter a positive value.");
                    }
               } while (newQuantity < 0);
               inventory[itemIndex].quantity = newQuantity;
               updateInventoryTable();
          }

          let deleteRequest = store.delete(itemID); // Add the new item with a unique ID

          getRequest.onsuccess = function (event) {

               const item = event.target.result;

               if (item) {

                    item.quantity = newQuantity; // Update quantity

                    // Put the updated object back in the store
                    let putRequest = store.put(item);

                    putRequest.onsuccess = function (event) {
                         console.log("Object updated successfully!");
                    };

                    putRequest.onerror = function (event) {
                         console.error("Error updating object:", event.target.error);
                    };
               } else {
                    console.error("Item not found:", itemID);
               }

               deleteRequest.onsuccess = function () {
                    console.log("Object deleted successfully!");
               };
               deleteRequest.onerror = function (event) {
                    console.error("Error deleting object:", event.target.error);
               };

               transaction.oncomplete = () => {
                    console.log('Item deleted from IndexedDB successfully');
                    updateInventoryTable(); // Update UI with the new item
               };
               transaction.onerror = (event) => {
                    console.error('Error adding item to IndexedDB:', event.target.error);
               };
          }
     });
}

/**
 * The `editItemPrice` function updates the price of an item in an IndexedDB store and updates the UI
 * accordingly.
 * @param itemName - The `itemName` parameter represents the name of the item whose price you want to
 * edit in the inventory.
 * @param itemID - The `itemID` parameter is the unique identifier of the item in the IndexedDB that
 * you want to edit the price for. It is used to retrieve the item from the database and update its
 * price.
 */
function editItemPrice(itemName, itemID) {
     openIndexedDB().then(db => {
          const transaction = db.transaction('inventory', 'readwrite');
          const store = transaction.objectStore('inventory');

          let getRequest = store.get(itemID);

          const itemIndex = inventory.findIndex(item => item.name === itemName);
          let newPrice;
          if (itemIndex !== -1) {
               newPrice = parseFloat(prompt("Enter new price:", inventory[itemIndex].price));
               if (!isNaN(newPrice) && newPrice !== inventory[itemIndex].price) { // Check if price has changed
                    inventory[itemIndex].price = newPrice;
                    updateInventoryTable();
               }
          }
          let deleteRequest = store.delete(itemID); // Add the new item with a unique ID

          getRequest.onsuccess = function (event) {

               const item = event.target.result;

               if (item) {

                    item.price = newPrice; // Update price

                    // Put the updated object back in the store
                    let putRequest = store.put(item);

                    putRequest.onsuccess = function (event) {
                         console.log("Object updated successfully!");
                    };

                    putRequest.onerror = function (event) {
                         console.error("Error updating object:", event.target.error);
                    };
               } else {
                    console.error("Item not found:", itemID);
               }

               deleteRequest.onsuccess = function () {
                    console.log("Object deleted successfully!");
               };
               deleteRequest.onerror = function (event) {
                    console.error("Error deleting object:", event.target.error);
               };

               transaction.oncomplete = () => {
                    console.log('Item deleted from IndexedDB successfully');
                    updateInventoryTable(); // Update UI with the new item
               };
               transaction.onerror = (event) => {
                    console.error('Error adding item to IndexedDB:', event.target.error);
               };
          }
     });
}

/**
 * The `restockItem` function updates the quantity of an item in an IndexedDB store to 100 and deletes
 * the item if it exists, then updates the UI accordingly.
 * @param itemName - The `itemName` parameter is the name of the item that you want to restock in the
 * inventory. It is used to identify the item in the inventory for restocking purposes.
 * @param itemID - The `itemID` parameter is the unique identifier of the item in the inventory. It is
 * used to retrieve the item from the IndexedDB, update its quantity to 100, and then delete the item
 * from the database.
 */
function restockItem(itemName, itemID) {

     openIndexedDB().then(db => {
          const transaction = db.transaction('inventory', 'readwrite');
          const store = transaction.objectStore('inventory');

          let getRequest = store.get(itemID);


          const itemIndex = inventory.findIndex(item => item.name === itemName);
          if (itemIndex !== -1) {
               inventory[itemIndex].quantity = Math.max(inventory[itemIndex].quantity, 100);
               updateInventoryTable();
               updateInventorySummary();
          }

          let deleteRequest = store.delete(itemID); // Add the new item with a unique ID

          getRequest.onsuccess = function (event) {

               const item = event.target.result;

               if (item) {

                    item.quantity = 100; // Update quantity

                    // Put the updated object back in the store
                    let putRequest = store.put(item);

                    putRequest.onsuccess = function (event) {
                         console.log("Object updated successfully!");
                    };

                    putRequest.onerror = function (event) {
                         console.error("Error updating object:", event.target.error);
                    };
               } else {
                    console.error("Item not found:", itemID);
               }

               deleteRequest.onsuccess = function () {
                    console.log("Object deleted successfully!");
               };
               deleteRequest.onerror = function (event) {
                    console.error("Error deleting object:", event.target.error);
               };

               transaction.oncomplete = () => {
                    console.log('Item deleted from IndexedDB successfully');
                    updateInventoryTable(); // Update UI with the new item
               };

               transaction.onerror = (event) => {
                    console.error('Error adding item to IndexedDB:', event.target.error);
               };

          }

     });
}

/**
 * The `restockInventory` function updates the quantity of items in an inventory stored in an IndexedDB
 * by restocking them with a specified quantity.
 */
function restockInventory() {

     openIndexedDB().then(db => {
          const transaction = db.transaction('inventory', 'readwrite');
          const store = transaction.objectStore('inventory');


          let restockQuantity;
          restockQuantity = parseInt(prompt("Restock all listed items:"));
          if (!isNaN(restockQuantity) && restockQuantity > 0) {
               for (let item of inventory) {
                    let getRequest = store.get(item.id);
                    item.quantity = Math.max(item.quantity, restockQuantity); // Set quantity to restock value (unless already higher)

                    let deleteRequest = store.delete(item.id); // Add the new item with a unique ID

                    getRequest.onsuccess = function (event) {

                         const item = event.target.result;

                         if (item) {

                              item.quantity = Math.max(item.quantity, restockQuantity); // Update quantity

                              // Put the updated object back in the store
                              let putRequest = store.put(item);

                              putRequest.onsuccess = function (event) {
                                   console.log("Object updated successfully!");
                              };

                              putRequest.onerror = function (event) {
                                   console.error("Error updating object:", event.target.error);
                              };
                         } else {
                              console.error("Item not found:", item.id);
                         }
                         deleteRequest.onsuccess = function () {
                              console.log("Object deleted successfully!");
                         };
                         deleteRequest.onerror = function (event) {
                              console.error("Error deleting object:", event.target.error);
                         };

                         transaction.oncomplete = () => {
                              console.log('Item deleted from IndexedDB successfully');
                              updateInventoryTable(); // Update UI with the new item
                         };

                         transaction.onerror = (event) => {
                              console.error('Error adding item to IndexedDB:', event.target.error);
                         };

                    }
                    updateInventoryTable();
                    updateInventorySummary();
               }
          } else {
               alert("Please enter a valid positive restock quantity.");
          }
     });
}

/**
 * The `spoiledInventory` function checks for expired items in the inventory, deletes them from the
 * canvas and database, and updates the UI accordingly.
 */
function spoiledInventory() {
     openIndexedDB().then(db => {
          const transaction = db.transaction('inventory', 'readwrite');
          const store = transaction.objectStore('inventory');

          const today = new Date(); // Get today's date 

          for (let item of inventory) {
               const expiration = new Date(item.expiration)
               if (expiration.getTime() <= today.getTime()) {
                    deleteItem(item.name); // Deletes spoiled products from canvas
                    let deleteRequest = store.delete(item.id); // Deletes spoiled products from database

                    deleteRequest.onsuccess = function () {
                         console.log("Object deleted successfully!");
                    };

                    deleteRequest.onerror = function (event) {
                         console.error("Error deleting object:", event.target.error);
                    };


                    transaction.oncomplete = () => {
                         console.log('Item deleted from IndexedDB successfully');
                         updateInventoryTable(); // Update UI with the new item
                    };

                    transaction.onerror = (event) => {
                         console.error('Error adding item to IndexedDB:', event.target.error);
                    };
               }
          }
     });

     updateInventoryTable(); // Update table to reflect changes
     updateInventorySummary(); // Update summary totals
}

// Buttons, what else can i say?
const restockButton = document.getElementById('restock_button');
restockButton.addEventListener('click', restockInventory);

const spoilageButton = document.getElementById('spoilage_button');
spoilageButton.addEventListener('click', spoiledInventory);


/* This code is handling form submission for an item form. When the form is submitted,
it prevents the default form submission behavior. It then retrieves the values entered in the form
fields for item name, quantity, price, and expiration date. It generates a unique ID for the item
and checks if the entered values are valid (item name is not empty, quantity and price are numbers,
and quantity is non-negative). */
const itemForm = document.getElementById('itemform');
itemForm.addEventListener('submit', function (event) {
     event.preventDefault(); // Prevent default form submission

     const itemName = document.getElementById('item_name').value;
     const itemQuantity = parseInt(document.getElementById('item_quantity').value);
     const itemPrice = parseFloat(document.getElementById('item_price').value);
     const itemExpiration = document.getElementById('item_expiration').value;
     let itemID = generateUniqueID();
     if (itemName && !isNaN(itemQuantity) && !isNaN(itemPrice) && itemQuantity >= 0) {

          //addItem({ name: itemName, quantity: itemQuantity, price: itemPrice, expiration: itemExpiration, id: itemID});
          itemForm.reset(); // Reset form only after successful addition
     }

     const newItem = {
          id: itemID,
          name: itemName,
          quantity: itemQuantity,
          price: itemPrice,
          expiration: itemExpiration
     }; // Create item object with ID

     addInventoryItem(newItem);

     saveInventoryToDB();
});

/**
 * The function `generateUniqueID` generates a unique ID using a combination of random numbers and base
 * 36 conversion.
 * @returns The `generateUniqueID` function returns a string that consists of two random alphanumeric
 * strings concatenated together.
 */
function generateUniqueID() {
     /* This generates a random string by concatenating two random strings. Each
     random string is generated using `Math.random()` to get a random number between 0 and 1, then
     converting it to a base-36 string using `toString(36)`. Finally, it extracts a substring of
     length 13 characters (from index 2 to 15) from each of the generated random strings and
     concatenates them together to form a longer random string. */
     return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}