// Create a new MIPS machine with the
// parameter as an array that is the memory
// available to the system. It should be an
// array of 32 bit words.

const UINT_MAX = 4294967295; //2^bits -1
const INT_MAX = 2147483647; // 2^(bits-1) -1
const INT_MIN = -2147483648; // -2^(bits-1)
const INT_WRAP = UINT_MAX + 1;

function Mips() {
	this.reg = new Array();
	for(var i=0;i<31;i++) this.reg[i] = 0;
	this.reg[31] = 0x08FFFFFFF;
	this.PC = 0;
	this.hi = 0;
	this.lo = 0;
	this.state = 0;
	this.mipsexception = function(str) {
		this.state = 1;
		alert("EXCEPTION: " + str);
	}
	this.u_int = function(x) {
		var r = parseInt(x);
		if(isNaN(r)) {
			return this.mipsexception("BAD UINT: " + r + x);
		}
		if(r < 0 ) {
			return (r % UINT_MAX) + UINT_MAX;
		}
		return r % UINT_MAX;
	}
	this.u_reg = function(x) { return this.u_int(this.reg[x])}
	this.s_int= function(x) {
		var r = parseInt(x);
		if(isNaN(r)) {
			return this.mipsexception("BAD INT: " + r + x);
		}
		if(r > INT_MAX) {
			return this.s_int(r - INT_WRAP);
		}
		if(r < INT_MIN) {
			return this.s_int(r + INT_WRAP);
		}
		return r;
	}
	this.s_reg = function(x) { return this.s_int(this.reg[x])}
	this.step = function() {
		if(this.state != 0) {
			return this.mipsexception("CPU STATE HAZY, PLEASE RESET");
		}
		if(this.PC == 0x08FFFFFFF) {
			return this.mipsexception("CPU HALTED");
		}
		var op = this.u_int(mmu.read(this.PC));
		this.PC = this.u_int(this.PC + 4);
		this.reg[0] = 0;
		if(op === 0) {
			return "NOP"; // nop is a special case'd instruction cause im cool
		}

		//Decoding bits of instruction that might be of interest
		//topbits then possibly low bits determine opcode
		var topbits = (op & 0x0FC000000) >> 26;
		var lowbits = (op & 0x03F);
		var s = (op & 0x003E00000) >> 21;
		var t = (op & 0x0001F0000) >> 16;
		var d = (op & 0x00000F800) >> 11;
		var i = (op & 0x00000FFFF);

		// the instruction set has two tables depending on what bits distinguish
		// which instruction it is. Ideally, this could be generalized a bit more
		// with an "instruction mask" from the argformat and just matching on it.
		if(topbits) {
			return CS241MIPS.topbits[topbits](cpu, s, t, i);
		} else if(lowbits) {
			return CS241MIPS.lowbits[lowbits](cpu, s, t, i);
		} else {
			return cpu.mipsexception("Illegal Opcode");
		}
	}
}
