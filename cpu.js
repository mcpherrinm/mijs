// Create a new MIPS machine with the
// parameter as an array that is the memory
// available to the system. It should be an
// array of 32 bit words.

const UINT_MAX = 4294967295; //2^bits -1
const INT_MAX = 2147483647; // 2^(bits-1) -1
const INT_MIN = -2147483648; // -2^(bits-1)
const INT_WRAP = 4294967296; // 2^(bits)

function Mips() {
    this.mem = new Array();
    this.reg = new Array();
	this.memsize = 1024; // Memory size IN WORDS (aka this.mem.length())
	for(var i=0;i<this.memsize;i++) this.mem[i] = 0;
	for(var i=0;i<31;i++) this.reg[i] = 0;
	this.reg[31] = 0x0FFFFFFFF;
    this.PC = 0;
    this.hi = 0;
    this.lo = 0;
	this.state = 0;
    this.mipsexception = function(str) {
		this.state = 1;
        alert("EXCEPTION: " + str);
    }
    this.tlblookup = function(addr) {
		if(addr % 4 != 0) {
				return this.mipsexception("UNALIGNED ACCESS");
		}
		if(addr / 4 > this.memsize) {
				return this.mipsexception("YOU MAY NOT PASS (the end of memory)");
		}
        return addr / 4;
    }
	this.load = function(arr, addr) {
			if(addr % 4 != 0) {
					return this.mipsexception("UNALIGNED LOAD");
			}
			var offset = addr / 4;
			for(key in arr) {
					//addr loading not here
					this.mem[key] = arr[key]
			}
	}
    this.fixoverflow =  function(x) { return x & 0x0FFFFFFFF;}

	this.u_int = function(x) {
			var r = parseInt(x);
			if(isNaN(r)) {
					return this.mipsexception("BAD UINT: " + r + x);
			}
			if(r < 0 ) {
				return (r % UINT_MAX) + UINT_MAX;
			}
			return r % UINT_MAX;
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
			if(this.PC == 0x0FFFFFFFF) {
					return this.mipsexception("CPU HALTED");
			}
        var op = this.u_int(this.mem[this.tlblookup(this.PC)]);
        this.PC += 4;
		this.reg[0] = 0;
        if(op === 0) {
            return "NOP"; // nop
        }

		//Decoding bits of instruction that might be of interest
		//topbits then possibly low bits determine opcode
        var topbits = (op & 0x0FC000000) >> 26;
        var lowbits = (op & 0x03F);
        var s = (op & 0x003E00000) >> 21;
        var t = (op & 0x0001F0000) >> 16;
        var d = (op & 0x00000F800) >> 11;
        var i = (op & 0x00000FFFF);
        switch(topbits){
        case 0x023: //lw
            this.reg[t] = this.mem[this.tlblookup(this.reg[s] + i)];
			return "lw $" + t + ", " + i + "($" + s + ")";
        case 0x02B: // sw
            this.mem[this.tlblookup(this.reg[s] + i)] = this.reg[t];
			return "sw $" + t + ", " + i + "($" + s + ")";
        case 0x04:
            //beq
            if(this.s_reg(s) == this.s_reg(t)) {
                this.PC += i*4;
            }
			return "BEQ $" + t + ", $" + s + " " + i; 
        case 0x05: //bne
            if(this.s_reg(s) != this.s_reg(t)) {
                this.PC += i*4;
            }
			return "BNE $" + t + ", $" + s + " " + i;
        case 0:
            switch(lowbits){
            case 0x020: //Add
					this.reg[d] = 
							this.s_int( this.s_reg(s)+
									    this.s_reg(t));
				return "add $" + d + ", $" + s + ", $" + t;
            case 0x022: //sub
					this.reg[d] = 
							this.s_int( this.s_reg(s)
									  - this.s_reg(t));
				return "sub $" + d + ", $" + s + ", $" + t;
            case 0x018: //mult
                var rslt = this.s_reg(s) * this.s_reg(t);
                this.lo = rslt & 0x000000000FFFFFFFF;
                this.hi = rslt & 0x0FFFFFFFF00000000;
				return "mult $" + s + ", $" + t;
            case 0x019: //multu
				var rslt= this.u_reg(s) * this.u_reg(t);
                this.lo = rslt & 0x000000000FFFFFFFF;
                this.hi = rslt & 0x0FFFFFFFF00000000;
				return "multu $" + s + ", $" + t;
            case 0x01A: //div
				var n = this.s_reg(s);
				var d = this.s_reg(t);
				this.hi = n % d;
                this.hi = (n - this.hi ) / d;
                var rslt= (n - (n % d) ) / d;
				return "div $" + s + ", $" + t;
            case 0x01B: //divu
				var n = this.u_reg(s);
				var d = this.u_reg(t);
				this.hi = n % d;
                this.hi = (n - this.hi ) / d;
				return "divu $" + s + ", $" + t;
            case 0x014: //lis
				// PC has already been incremented, load next word
				this.reg[d] = this.mem[this.tlblookup(this.PC)];
                this.PC += 4; // skip data we just loaded
				return "lis $" + d; 
			case 0x0: //mfhi $d
				this.reg[d] = this.hi;
				return "mfhi $" + d;
			case 0x0: //mflo $d
				this.reg[d] = this.lo;
				return "mflo $" + d;
            case 0x02A: //slt
				if(this.s_reg(s)) < this.s_reg(t))) {
						this.reg[d] = 1;
				} else {
						this.reg[d] = 0;
				}
				return "slt $" + d + ", $" + s + ", $" + t;
            case 0x02B: //sltu
				if(this.u_reg(s)) < this.u_reg(t))) {
						this.reg[d] = 1;
				} else {
						this.reg[d] = 0;
				}
				return "sltu $" + d + ", $" + s + ", $" + t;
            case 0x09: //jalr
                this.reg[31] = this.PC;
                this.PC = this.u_reg(s);
				return "jalr $" + s;
            case 0x08: //jr
                this.PC = this.u_reg(s));
				return "jr $" + s;
            default:
                return this.mipsexception("OP: Illegal R instruction: " + op);
            }
        default:
                return this.mipsexception("OP: Illegal I instruction: ");
        }
    }
}
