let offset = 0;
    const limit = 20;
    let mostrandoFavoritos = false;

    const typeColors = {
      normal: '#A8A77A',
      fire: '#EE8130',
      water: '#6390F0',
      electric: '#F7D02C',
      grass: '#7AC74C',
      ice: '#96D9D6',
      fighting: '#C22E28',
      poison: '#A33EA1',
      ground: '#E2BF65',
      flying: '#A98FF3',
      psychic: '#F95587',
      bug: '#A6B91A',
      rock: '#B6A136',
      ghost: '#735797',
      dragon: '#6F35FC',
      dark: '#705746',
      steel: '#B7B7CE',
      fairy: '#D685AD'
    };

    function getFavoritos() {
      return JSON.parse(localStorage.getItem("favoritos")) || [];
    }

    function toggleFavorito(pokemon) {
      let favoritos = getFavoritos();
      const existe = favoritos.find(p => p.id === pokemon.id);

      if (existe) {
        favoritos = favoritos.filter(p => p.id !== pokemon.id);
      } else {
        favoritos.push(pokemon);
      }

      localStorage.setItem("favoritos", JSON.stringify(favoritos));
      carregarPokemons(); 
    }

    async function carregarPokemons() {
      const lista = document.getElementById("pokemonList");
      lista.innerHTML = "";

      if (mostrandoFavoritos) {
        const favoritos = getFavoritos();
        favoritos.forEach(p => criarCard(p));
        return;
      }

      const resposta = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
      const data = await resposta.json();

      const promises = data.results.map(async (pokemon) => {
        const resp = await fetch(pokemon.url);
        const detalhes = await resp.json();
        return {
          nome: detalhes.name,
          imagem: detalhes.sprites.other['official-artwork'].front_default || detalhes.sprites.front_default,
          id: detalhes.id,
          tipos: detalhes.types.map(t => t.type.name)
        };
      });

      const pokemons = await Promise.all(promises);
      pokemons.forEach(p => criarCard(p));
    }

    function criarCard(pokemon) {
      const lista = document.getElementById("pokemonList");
      const favoritos = getFavoritos();
      const isFavorito = favoritos.some(f => f.id === pokemon.id);

      const tiposHTML = pokemon.tipos
        .map(tipo => `<span class="type" style="background-color:${typeColors[tipo] || '#777'}">${tipo}</span>`)
        .join('');

      const card = document.createElement("div");
      card.className = "pokemon-card";
      card.innerHTML = `
        <button class="favorite-btn ${isFavorito ? "favorited" : ""}" title="${isFavorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}">★</button>
        <img src="${pokemon.imagem}" alt="${pokemon.nome}">
        <div class="pokemon-name">${pokemon.nome}</div>
        <div>ID: #${pokemon.id}</div>
        <div class="pokemon-types">${tiposHTML}</div>
      `;

      card.querySelector(".favorite-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFavorito(pokemon);
      });

      card.addEventListener("click", () => {
        showPokemonDetailsById(pokemon.id);
      });

      lista.appendChild(card);
    }

    document.getElementById("proxima").addEventListener("click", () => {
      if (!mostrandoFavoritos) {
        offset += limit;
        carregarPokemons();
      }
    });

    document.getElementById("anterior").addEventListener("click", () => {
      if (!mostrandoFavoritos && offset >= limit) {
        offset -= limit;
        carregarPokemons();
      }
    });

    document.getElementById("buscarBtn").addEventListener("click", async () => {
      const nome = document.getElementById("pokemonInput").value.toLowerCase();
      const resultado = document.getElementById("resultado");
      resultado.innerHTML = "";

      if (!nome) {
        resultado.innerHTML = `<p style="color:orange;">⚠️ por favor, digite o nome de um pokémon.</p>`;
        return;
      }

      resultado.innerHTML = `<p style="color: blue;">⏳ Carregando...</p>`

      try {
        const resposta = await fetch(`https://pokeapi.co/api/v2/pokemon/${nome}`);
        if (!resposta.ok) throw new Error("Pokémon não encontrado");

        const data = await resposta.json();
        const pokemon = {
          nome: data.name,
          id: data.id,
          imagem: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
          tipos: data.types.map(t => t.type.name)
        };

        const tiposHTML = pokemon.tipos
          .map(tipo => `<span class="type" style="background-color:${typeColors[tipo] || '#777'}">${tipo}</span>`)
          .join('');

        resultado.innerHTML = `
          <div class="pokemon-card" id="resultadoCard" style="margin: 20px auto;">
            <button class="favorite-btn ${getFavoritos().some(f=>f.id===pokemon.id) ? 'favorited' : ''}">★</button>
            <img src="${pokemon.imagem}" alt="${pokemon.nome}">
            <div class="pokemon-name">${pokemon.nome}</div>
            <div>ID: #${pokemon.id}</div>
            <div class="pokemon-types">${tiposHTML}</div>
          </div>
        `;

        resultado.querySelector(".favorite-btn").addEventListener("click", (e) => {
          e.stopPropagation();
          toggleFavorito(pokemon);
        });

        document.getElementById("resultadoCard").addEventListener("click", () => {
          showPokemonDetailsById(pokemon.id);
        });

        resultado.insertAdjacentHTML('beforeend', `<p style="margin-top:8px;color:#555;">Clique no card para ver detalhes.</p>`);

      } catch (Erro) {
        resultado.innerHTML = `<p style="color:red;"> ❌ Pokémon não encontrado!</p>`;
      }
    });

    document.getElementById("mostrarFavoritos").addEventListener("click", () => {
      mostrandoFavoritos = !mostrandoFavoritos;
      document.getElementById("mostrarFavoritos").innerText = mostrandoFavoritos
        ? "Mostrar Todos"
        : "Mostrar Favoritos";
      carregarPokemons();
    });

    document.getElementById('limparFav').addEventListener('click', () => {
      localStorage.removeItem('favoritos');
      mostrandoFavoritos = false;
      document.getElementById('mostrarFavoritos').innerText = 'Mostrar Favoritos';
      carregarPokemons();
    });

    const modalEl = document.getElementById('pokemonModal');
    const modalCloseBtn = document.getElementById('modalClose');
    const modalDetails = document.getElementById('modal-details');

    function setModalTheme(colorHex) {
        const content = document.querySelector('#pokemonModal .modal-content');
        if (content && colorHex) {
            content.style.setProperty('--accent', colorHex);
        }
    }
    async function showPokemonDetailsById(id) {
      try {
        const resp = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        if (!resp.ok) throw new Error('Erro ao obter detalhes');
        const pokemon = await resp.json();

        const img =
          (pokemon.sprites.other && pokemon.sprites.other['official-artwork'] && pokemon.sprites.other['official-artwork'].front_default) ||
          pokemon.sprites.front_default;

        const tiposHTML = pokemon.types
          .map(t => {
            const tipo = t.type.name;
            const bg = typeColors[tipo] || '#777';
            return `<span class="type" style="background-color:${bg}">${tipo}</span>`;
          })
          .join('');

          const primaryType = pokemon.types?.[0]?.type?.name || '';
          const accent = typeColors[primaryType] || '#777';
          setModalTheme(accent);

        modalDetails.innerHTML = `
          <img src="${img}" alt="${pokemon.name}">
          <p><strong>ID:</strong> #${String(pokemon.id).padStart(3, '0')}</p>
          <h2 id="modalTitle" style="text-transform:uppercase;margin:6px 0;">${pokemon.name}</h2>
          <div class="accent-bar"></div>
          <p><strong>Tipo(s):</strong> ${tiposHTML}</p>
          <p><strong>Altura:</strong> ${(pokemon.height/10).toFixed(1)} m</p>
          <p><strong>Peso:</strong> ${(pokemon.weight/10).toFixed(1)} kg</p>
        `;

        openModal();
      } catch (e) {
        modalDetails.innerHTML = `<p style="color:red;">Falha ao carregar detalhes do Pokémon.</p>`;
        openModal();
      }
    }

    function openModal() {
      modalEl.style.display = 'block';
      modalEl.setAttribute('aria-hidden', 'false');

      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modalEl.style.display = 'none';
      modalEl.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    modalCloseBtn.addEventListener('click', closeModal);

    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalEl.style.display === 'block') {
        closeModal();
      }
    });

    carregarPokemons();