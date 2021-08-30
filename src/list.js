const utils = require('./utils');
const cardModule = require('./card');
const listModule = {
    showAddListModal: () => {
        document.getElementById('addListModal').classList.add('is-active');
      },
      handleAddListForm: async (event) => {
        // on coupe le rechargement de la page
        event.preventDefault();
        // on passe en constructeur de FormData le formulaire qui a déclenché l'évènement submit : event.target. Ainsi on pourra facilement récupérer ses données avec get()
        const formData = new FormData(event.target);
    
        try {
          // ici on doit créer une liste, donc on doit renseigner en second paramètre de fetch un objet de config incluant deux propriétés : la premiere est la methode http utilisée (post) et la deuxieme est le body de la requête (donc le retour du formulaire, ici formData)
          const response = await fetch(`${utils.base_url}/lists`, {
            method: 'POST',
            body: formData
          });
          if(response.status !== 201) throw await response.json();
          const list = await response.json();
          // On appelle la méthode pour créer une nouvelle liste en lui passant en paramètre le nom donné dans le formulaire
          listModule.makeListInDOM(list);
    
        } catch(error) {
          console.error(error);
        }
        
         // ici on ne s'embete pas à réécrire le code pour fermer la modal puisqu'on a déjà une fonction prête à l'emploi dont on peut se servir !
        utils.hideModals();
      },
      makeListInDOM: (list) => {
        // on cible le template
        const template = document.getElementById('list-template');
        // on clone tout le contenu (true) du template 
        const newList = document.importNode(template.content, true);
        // on cible le titre de la liste et on modifie son titre avec ce qui a été renseigné dans le formulaire d'ajout
        const h2 = newList.querySelector('h2');
        h2.textContent = list.name;
        h2.addEventListener('dblclick', listModule.showEditListForm);
    
        // on modifie data-list-id de la liste
        const div = newList.querySelector('[data-list-id]');
        
        //façon classique de faire : div.setAttribute('data-list-id', name)
        // cependant, on manipule ici un attribut data, on peut y accéder via dataset.sonNom
        // attention, si le nom du data attribut contient un - il faut le retirer et mettre une majuscule à la lettre d'après (camelCase)
        // exemple ici : list-id en listId
        div.dataset.listId = list.id;
    
        // je cible l'input id du formulaire pour lui appliquer le bon id. Ca sera utile lorsqu'on voudra éditer la liste (pour cibler la bonne liste)
        div.querySelector('input[name="id"]').value = list.id;
    
        newList.querySelector('.button--add-card').addEventListener('click', cardModule.showAddCardModal);
    
        newList.querySelector('.button--delete-list').addEventListener('click', listModule.deleteList);
        // on insère la nouvelle liste dans le document
        document.querySelector('.card-lists').appendChild(newList);
      },
      showEditListForm: (event) => {
        event.target.classList.add('is-hidden');
        const form = event.target.closest('.panel').querySelector('form');
        form.classList.remove('is-hidden');
        form.addEventListener('submit', listModule.handleEditList);
      },
      handleEditList: async (event) => {
        event.preventDefault();
        // ici event.target c'est le formulaire qui appelle l'evenement submit !
        try {
          // event.target c'est l'élément HTML origine de l'évènement déclenché, ici le formulaire
          const formData = new FormData(event.target);
          // l'utilisation de formData nous évite à cibler nos inputs pour récuperer leur valeur !
          // nous évite de : const name = document.getElementById('inputName').value;
          // ici on utilise la méthode patch de fetch pour modifier la liste ciblée
          const response = await fetch(`${utils.base_url}/lists/${formData.get('id')}`, {
          method: 'PATCH',
          body:formData
          });
          if(response.status !== 200) throw await response.json();
          const list = await response.json();
          const h2 =  event.target.closest('.panel').querySelector('h2');
          h2.textContent = list.name; // on aurait pu mettre formData.get('name')
          event.target.classList.add('is-hidden');
          h2.classList.remove('is-hidden');
    
        } catch(error) {
          console.error(error);
        }
        
      },
      deleteList: async (event) => {
          // on demand ela confirmation. Si la personne clique sur valider, "true" sera stocké dans la variable. false sinon.
        const wantDelete = confirm('Voulez-vous vraiment supprimer cette liste ?');
        if(!wantDelete) return;

        const list = event.target.closest('.panel');
        const listId = list.dataset.listId;
        // on vérifie si la liste a déjà des cartes, si c'est le cas alors on empêcvhe la suppression
        if(list.querySelectorAll('.box').length) return alert('Désolé mais non car il y a des cartes au sein de cette liste !');
        try {
            const response = await fetch(`${utils.base_url}/lists/${listId}`, {
                method: 'DELETE'
            });
            if(!response.ok) throw await response.json();
            list.remove();
        } catch(error) {
            console.error(error);
        }
      },
      dropList: async () => {
          // on recupère toutes les listes dans le DOM
        const lists = document.querySelectorAll('.panel');
          // puis on appelle la methode patch sur chacune d'entre elles
        for(let i = 0; i < lists.length; i++){
            try {
                // on fait un objet formData qui va contenir la nouvelle position de la liste. Effectivement, le body de la methode patch ou post attend un formData et rien d'autre
                const formData = new FormData();
                // on lui donne la bonne position avec la méthode set de formData
                formData.set('position', i + 1);
                // on récupère l'id de la liste  du dom en cours 
                const listId = lists[i].dataset.listId;
                // on appelle fetch pour mettre à jour sa position en base
                const response = await fetch(`${utils.base_url}/lists/${listId}`, {
                    method: 'PATCH',
                    body: formData
                });
                if(!response.ok) throw await response.json();
            } catch(error) {
                console.error(error);
            }

        }
      }
}

module.exports = listModule;