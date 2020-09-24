// Refresh the table
let refreshTable = () => {
    // Get all saved layouts
    fetch('/stored/get')
        .then(data => data.json())
        .then(data => {
            document.getElementById("idMain").innerHTML = "";

            if (data.length < 1) {
                document.getElementById("idNothing").innerHTML = "Nothing saved yet";
            } else {
                document.getElementById("idNothing").innerHTML = "";
            }

            for (let layout of data) {
                // Create a card
                let card = document.createElement('div');
                card.setAttribute("class", "card");
                card.setAttribute("style", "width: 18rem;");

                let image = document.createElement("img");
                image.setAttribute("class", "card-img-top");
                image.setAttribute("src", layout.picture);
                image.setAttribute("alt", "layout" + layout.id);
                image.setAttribute("height", "160");

                let body = document.createElement("div");
                body.setAttribute("class", "card-body");

                let title = document.createElement("h5");
                title.setAttribute("class", "card-title");
                title.innerHTML = layout.title;

                let text = document.createElement("p");
                text.setAttribute("class", "card-text");
                let date = layout.date_created.split(".");
                let _date = date[0].split("T");
                text.innerHTML = "Data created: " + _date[1] + " " + _date[0];

                let btnLoad = document.createElement("a");
                btnLoad.setAttribute("class", "btn btn-primary");
                btnLoad.setAttribute("id", "btnLoad" + layout.id);
                btnLoad.innerHTML = "Load";
                btnLoad.addEventListener("click", function () {
                    loadHandler(layout.id);
                });

                let btnEdit = document.createElement("a");
                btnEdit.setAttribute("class", "btn btn-primary ml-2");
                btnEdit.innerHTML = "Edit";
                btnEdit.addEventListener("click", function () {
                    updateHandler(layout.id, layout.title);
                });

                let btnDelete = document.createElement("a");
                btnDelete.setAttribute("class", "btn btn-primary ml-2");
                btnDelete.innerHTML = "Delete";
                btnDelete.addEventListener("click", function () {
                    deleteHandler(layout.id);
                });


                body.appendChild(title);
                body.appendChild(text);
                body.appendChild(btnLoad);
                body.appendChild(btnEdit);
                body.appendChild(btnDelete);

                card.appendChild(image);
                card.appendChild(body);
                document.getElementById("idMain").appendChild(card);
            }
        })
        .catch(() => {
            console.log("Something went wrong");
        })
};

// Load handler
let loadHandler = (id) => {
    // Redirect to home and add to url the id
    location.replace('/home?id=' + id)
};

// Deletehandler to delete posts
let deleteHandler = (id) => {
    fetch('stored/' + id, {
        method: 'DELETE'
    })
        .then(() => {
            console.log("Delete successful");
            refreshTable();
        })
        .catch(() => {
            console.log("Something went wrong");
        })
};

// Funcion to update the title of a stored element
let updateHandler = (id, title) => {
    let answ = window.prompt("New file name: ", title);

    if (answ !== null && answ !== '') {
        fetch('stored/' + id, {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({"title": answ})
        })
            .then((response) => {
                console.log("Update successful");
                refreshTable();
            })
            .catch(() => {
                console.log("Something went wrong");
            })
    }
};

// Function to clear the entire database
let clearDataBase = () => {
    let answ = window.confirm("Are you sure?");

    if (answ) {
        fetch('stored/delete', {
            method: 'DELETE'
        })
            .then((response) => {
                if (response.status === 200) {
                    console.log("Successful");
                    refreshTable();
                } else {
                    console.log("Something went wrong");
                }
            })
            .catch(() => {
                console.log("Something went wrong");
            })
    }
};

document.getElementById('idClearDB').onclick = clearDataBase;
refreshTable();


