const TronWeb = require('tronweb');

const fullNode = 'https://api.shasta.trongrid.io';
const solidityNode = 'https://api.shasta.trongrid.io';
const eventServer = 'https://api.shasta.trongrid.io';
const privateKey = 'c0241e699a2944ac7b31561acec164337f70f38f557db26cdbc72f7e72e4a447';
const tronWeb = new TronWeb(fullNode,solidityNode,eventServer,privateKey);

class CryptoTronService {
	createCryptoWallet() {
		return tronWeb.createAccount();
	}
}