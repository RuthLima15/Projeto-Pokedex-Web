 // Estado básico de paginação e filtro
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

    //Favoritos (LocalStorage)
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

    // Carrega e renderiza a grade de cards
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

    //Cria um card clicável para um Pokémon
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
        exibirModalDoPokemon(pokemon.id);
      });

      lista.appendChild(card);
    }

    // Controles de paginação (próxima/anterior)
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

      // Feedback de carregamento
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

        // Desenha um card com o resultado da busca
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
          exibirModalDoPokemon(pokemon.id);
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

    //Limpa todos os favoritos e volta para a listagem normal
    document.getElementById('limparFav').addEventListener('click', () => {
      localStorage.removeItem('favoritos');
      mostrandoFavoritos = false;
      document.getElementById('mostrarFavoritos').innerText = 'Mostrar Favoritos';
      carregarPokemons();
    });

    // Referências do modal (detalhes do Pokémon)
    const $modal           = document.getElementById('pokemonModal');
    const $modalFecharBtn  = document.getElementById('modalClose');
    const $modalDetalhes   = document.getElementById('modal-details');

    /** Aplica a cor de destaque no conteúdo do modal. */
    function aplicarTemaDoModal(corHex) {
        const conteudo = document.querySelector('#pokemonModal .modal-content');
        if (conteudo && corHex) conteudo.style.setProperty('--accent', corHex);
    }

    /** Trava/destrava o scroll da página ao abrir/fechar modal. */
    function bloquearScroll(bloquear = true) {
        document.body.style.overflow = bloquear ? 'hidden' : '';
    }

    /** Abre o modal */
    function abrirModal() {
        $modal.style.display = 'block';
        $modal.setAttribute('aria-hidden', 'false');
        bloquearScroll(true);
    }

    /** Fecha o modal */
    function fecharModal() {
        $modal.style.display = 'none';
        $modal.setAttribute('aria-hidden', 'true');
        bloquearScroll(false);
    }


    /** Converte decímetros -> metros e hectogramas */
    function formatarMedidas({ decimetros, hectogramas }) {
        const alturaM = (decimetros / 10).toFixed(1);
        const pesoKg  = (hectogramas / 10).toFixed(1);
        return { alturaM, pesoKg };
    }

    /** Gera os chips de tipos com a cor correspondente. */
    function montarTiposHTML(types) {
    return (types || [])
        .map(({ type }) => {
        const nomeTipo = type?.name ?? 'unknown';
        const bg = typeColors[nomeTipo] || '#777';
        return `<span class="type" style="background-color:${bg}">${nomeTipo}</span>`;
        })
        .join('');
    }

    /** Retorna a melhor URL de imagem disponível. */
    function obterImagem(pokemon) {
    return (
        pokemon?.sprites?.other?.['official-artwork']?.front_default ||
        pokemon?.sprites?.front_default ||
        ''
    );
    }

    /** Decide a cor de destaque pelo primeiro tipo. */
    function obterCorDeDestaque(types) {
        const tipoPrincipal = types?.[0]?.type?.name ?? '';
        return typeColors[tipoPrincipal] || '#777';
    }

    /** Monta o HTML dos detalhes do Pokémon. */
    function montarDetalhesHTML(pokemon) {
        const imgURL = obterImagem(pokemon);
        const idPad   = String(pokemon.id).padStart(3, '0');
        const tipos   = montarTiposHTML(pokemon.types);
        const { alturaM, pesoKg } = formatarMedidas({
        decimetros: pokemon.height,
        hectogramas: pokemon.weight
    });

    return `
        <img src="${imgURL}" alt="${pokemon.name}">
        <p><strong>ID:</strong> #${idPad}</p>
        <h2 id="modalTitle" style="text-transform:uppercase;margin:6px 0;">
            ${pokemon.name}
        </h2>
        <div class="accent-bar"></div>
        <p><strong>Tipo(s):</strong> ${tipos}</p>
        <p><strong>Altura:</strong> ${alturaM} m</p>
        <p><strong>Peso:</strong> ${pesoKg} kg</p>
        `;
    }

    /** Busca dados do Pokémon por id */
    async function buscarPokemonPorId(id) {
        const resp = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        if (!resp.ok) throw new Error('Falha ao obter detalhes da API');
        return resp.json();
    }

    /** Exibe o modal com os detalhes do Pokémon pelo id. */
    async function exibirModalDoPokemon(id) {
        try {
            const pokemon = await buscarPokemonPorId(id);
            aplicarTemaDoModal(obterCorDeDestaque(pokemon.types));
            $modalDetalhes.innerHTML = montarDetalhesHTML(pokemon);
            abrirModal();
        } catch (err) {
            $modalDetalhes.innerHTML = `<p style="color:red;">Falha ao carregar detalhes do Pokémon.</p>`;
            abrirModal();
        }
    }

    $modalFecharBtn.addEventListener('click', fecharModal);

    $modal.addEventListener('click', (e) => {
        if (e.target === $modal) fecharModal();
    });

    document.addEventListener('keydown', (e) => {
        const aberto = $modal.style.display === 'block';
        if (e.key === 'Escape' && aberto) fecharModal();
    });

    // Inicializa
    carregarPokemons();