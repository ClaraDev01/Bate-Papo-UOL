const UUID = "9c431b8c-3332-4efd-8665-fe36cd78c208";
const API = "https://mock-api.driven.com.br/api/v6/uol";

let nomeUsuario = "";
let destinatario = "Todos";
let tipoMensagem = "message";

async function entrarNaSala() {
    let nome = prompt("Qual o seu nome?");
    while (true) {
        const resposta = await fetch(`${API}/participants/${UUID}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: nome })
        });
        if (resposta.status === 200) {
            nomeUsuario = nome;
            break;
        } else {
            nome = prompt("Nome já em uso! Digite outro nome:");
        }
    }
    iniciarChat();
}

function iniciarChat() {
    buscarMensagens();
    setInterval(buscarMensagens, 3000);
    setInterval(manterConexao, 5000);
}

async function manterConexao() {
    await fetch(`${API}/status/${UUID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nomeUsuario })
    });
}

async function buscarMensagens() {
    const resposta = await fetch(`${API}/messages/${UUID}`);
    const mensagens = await resposta.json();
    const chat = document.getElementById("chat");
    chat.innerHTML = "";
    mensagens.forEach(msg => {
        if (msg.type === "private_message") {
            if (msg.to !== nomeUsuario && msg.from !== nomeUsuario) return;
        }
        const div = document.createElement("div");
        div.classList.add("mensagem", msg.type);
        div.innerHTML = `
    <span class="hora">(${msg.time})</span>
    <span class="nome">${msg.from}</span>
    ${msg.type === "status"
                ? ` ${msg.text}`
                : ` para <span class="nome">${msg.to}</span>:  ${msg.text}`
            }
    `;
        chat.appendChild(div);
    });
    const ultima = chat.lastElementChild;
    if (ultima) ultima.scrollIntoView();
}

async function enviarMensagem() {
    const input = document.getElementById("input-mensagem");
    const texto = input.value.trim();
    if (!texto) return;
    const resposta = await fetch(`${API}/messages/${UUID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            from: nomeUsuario,
            to: destinatario,
            text: texto,
            type: tipoMensagem
        })
    });
    if (resposta.status === 200) {
        input.value = "";
        buscarMensagens();
    } else {
        window.location.reload();
    }
}

document.getElementById("btn-enviar").addEventListener("click", enviarMensagem);
document.getElementById("input-mensagem").addEventListener("keypress", (e) => {
    if (e.key === "Enter") enviarMensagem();
});

entrarNaSala();

const btnParticipantes = document.getElementById("btn-participantes");
const overlay = document.getElementById("overlay");
const menuLateral = document.getElementById("menu-lateral");

btnParticipantes.addEventListener("click", () => {
    menuLateral.classList.add("aberto");
    overlay.classList.add("ativo");
    buscarParticipantes();

    document.querySelectorAll(".opcao-visibilidade").forEach(op => {
        op.onclick = () => {
            document.querySelectorAll(".opcao-visibilidade").forEach(o => o.classList.remove("selecionado"));
            op.classList.add("selecionado");
            tipoMensagem = op.dataset.tipo;
            atualizarInfoEnvio();
        };
    });
});

overlay.addEventListener("click", () => {
    menuLateral.classList.remove("aberto");
    overlay.classList.remove("ativo");
});

async function buscarParticipantes() {
    const resposta = await fetch(`${API}/participants/${UUID}`);
    const participantes = await resposta.json();
    const lista = document.getElementById("lista-participantes");
    lista.innerHTML = "";

    const todos = document.createElement("div");
    todos.classList.add("opcao-participante");
    if (destinatario === "Todos") todos.classList.add("selecionado");
    todos.dataset.nome = "Todos";
    todos.innerHTML = `<i class="fa-solid fa-user-group"></i> Todos <span class="check">✓</span>`;
    todos.addEventListener("click", () => selecionarDestinatario("Todos", todos));
    lista.appendChild(todos);

    participantes.forEach(p => {
        const div = document.createElement("div");
        div.classList.add("opcao-participante");
        if (destinatario === p.name) div.classList.add("selecionado");
        div.dataset.nome = p.name;
        div.innerHTML = `<i class="fa-solid fa-circle-user"></i> ${p.name} <span class="check">✓</span>`;
        div.addEventListener("click", () => selecionarDestinatario(p.name, div));
        lista.appendChild(div);
    });
}

function selecionarDestinatario(nome, elemento) {
    document.querySelectorAll(".opcao-participante").forEach(op => op.classList.remove("selecionado"));
    elemento.classList.add("selecionado");
    destinatario = nome;
    atualizarInfoEnvio();
    menuLateral.classList.remove("aberto");
    overlay.classList.remove("ativo");
}

function atualizarInfoEnvio() {
    document.getElementById("destinatario-info").textContent = destinatario;
    document.getElementById("visibilidade-info").textContent = tipoMensagem === "message" ? "público" : "reservadamente";
}

setInterval(buscarParticipantes, 10000);