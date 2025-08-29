from flask import Flask, request, jsonify
from classificar import classificar_email
from responder import sugerir_resposta
from utils import extrair_texto_arquivo
from flask_cors import CORS 

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}) 

def apply_cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return resp

@app.route("/", methods=["GET"])
def home():
    return jsonify({"mensagem": "Automação está funcionando"})

@app.route("/upload", methods=["POST"])
def upload_email():
    if "file" in request.files:
        arquivo = request.files["file"]
        texto = extrair_texto_arquivo(arquivo)
    else:
        dados = request.get_json()
        texto = dados.get("texto", "")

    if not texto.strip():
        return jsonify({"erro": "Nenhum texto fornecido"}), 400

    classificacao = classificar_email(texto)
    resposta = sugerir_resposta(classificacao["categoria"], texto)

    return jsonify({
        "email_texto": texto,
        "classificacao": classificacao,
        "resposta_sugerida": resposta
    })

if __name__ == "__main__":
    app.run(debug=True)
