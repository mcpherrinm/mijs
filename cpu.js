/ Create a new MIPS machine with the
// parameter as an array that is the memory
// available to the system. It should be an
// array of 32 bit words.

const UINT_MAX = 4294967295; //2^bits -1
const INT_MAX = 2147483647; // 2^(bits-1) -1
const INT_MIN = -2147483648; // -2^(bits-1)
const INT_WRAP = 4294967296; // 2^(bits)

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
        var op = this.u_int(MMU.read(this.PC));
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
        switch(topbits){
        case 0x023: //lw
            cpu.reg[t] = MMU.read(cpu.reg[s] + i)];
			return "lw $" + t + ", " + i + "($" + s + ")";
        case 0x02B: // sw
			MMU.write(cpu.reg[s] + i, cpu.reg[t]);
			return "sw $" + t + ", " + i + "($" + s + ")";
        case 0x04: //beq
            if(cpu.s_reg(s) == cpu.s_reg(t)) {
                cpu.PC += i*4;
            }
			return "BEQ $" + t + ", $" + s + " " + i; 
        case 0x05: //bne
            if(cpu.s_reg(s) != cpu.s_reg(t)) {
                cpu.PC += i*4;
            }
			return "BNE $" + t + ", $" + s + " " + i;
        case 0:
       switch(lowbits){
       case 0x020: //Add
   			cpu.reg[d] = 
   					cpu.s_int( cpu.s_reg(s)+
   							    cpu.s_reg(t));
   		return "add $" + d + ", $" + s + ", $" + t;
       case 0x022: //sub
   			cpu.reg[d] = 
   					cpu.s_int( cpu.s_reg(s)
   							  - cpu.s_reg(t));
   		return "sub $" + d + ", $" + s + ", $" + t;
       case 0x018: //mult
           var rslt = cpu.s_reg(s) * cpu.s_reg(t);
           cpu.lo = rslt & 0x000000000FFFFFFFF;
           cpu.hi = rslt & 0x0FFFFFFFF00000000;
   		return "mult $" + s + ", $" + t;
       case 0x019: //multu
   		var rslt= cpu.u_reg(s) * cpu.u_reg(t);
           cpu.lo = rslt & 0x000000000FFFFFFFF;
           cpu.hi = rslt & 0x0FFFFFFFF00000000;
   		return "multu $" + s + ", $" + t;
       case 0x01A: //div
   		var n = cpu.s_reg(s);
   		var d = cpu.s_reg(t);
   		cpu.hi = n % d;
           cpu.hi = (n - cpu.hi ) / d;
           var rslt= (n - (n % d) ) / d;
   		return "div $" + s + ", $" + t;
       case 0x01B: //divu
   		var n = cpu.u_reg(s);
   		var d = cpu.u_reg(t);
   		cpu.hi = n % d;
           cpu.hi = (n - cpu.hi ) / d;
   		return "divu $" + s + ", $" + t;
       case 0x014: //lis
   		// PC has already been incremented, load next word
   		cpu.reg[d] = MMU.read(cpu.PC)];
		cpu.PC += 4; // skip data we just loaded
   		return "lis $" + d; 
   	case 0x010: //mfhi $d
   		cpu.reg[d] = cpu.hi;
   		return "mfhi $" + d;
   	case 0x012: //mflo $d
   		cpu.reg[d] = cpu.lo;
   		return "mflo $" + d;
       case 0x02A: //slt
   		if(cpu.s_reg(s) < cpu.s_reg(t)) {
   				cpu.reg[d] = 1;
   		} else {
   				cpu.reg[d] = 0;
   		}
   		return "slt $" + d + ", $" + s + ", $" + t;
       case 0x02B: //sltu
   		if(cpu.u_reg(s) < cpu.u_reg(t)) {
   				cpu.reg[d] = 1;
   		} else {
   				cpu.reg[d] = 0;
   		}
   		return "sltu $" + d + ", $" + s + ", $" + t;
       case 0x09: //jalr
           cpu.reg[31] = cpu.PC;
           cpu.PC = cpu.u_reg(s);
   		return "jalr $" + s;
       case 0x08: //jr
           cpu.PC = cpu.u_reg(s);
   		return "jr $" + s;
       default:
           return cpu.mipsexception("OP: Illegal R instruction: " + op);
       }
        default:
                return cpu.mipsexception("OP: Illegal I instruction: ");
        }
    }
}
