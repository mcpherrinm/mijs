var CS241MIPS = new function() {

	var encode = function(r1, r2, r3) {
		// and all the things together in the right places
		var g1 = parseInt(r1);
		var g2 = parseInt(r2);
		var g3 = parseInt(r3);
		if( 0 <= g1 && g1 <= 31 &&
				0 <= g2 && g2 <= 31 &&
				0 <= g3 && g3 <= 31
		  ) {
			return g1 << 21 | g2 << 16 | g3 << 11;
		} else {
			return 0;
		}

	};
	var i   = function(i) {
		return parseInt(/\.word\s+(\S+)/.exec(i)[1]); 
	};
	var tis = function(i) {
		var b = /\$([0-9]+),\s*([0-9]+)\(\$([0-9]+)\)/.exec(i);
		return encode(b[1], b[3], 0) & parseInt(b[2]);
	};
	var sti = function(i) {
		var b = /\$([0-9]+)\s*,\s*\$([0-9]+)\s*,\s*(\S)/.exec(i);
		return encode(b[1], b[2], 0) & parseInt(b[3]);
	}
	var dst = function(i) {
		var b = /\$([0-9]+),\s*\$([0-9]+),\s*\$([0-9]+)/.exec(i);
		return encode(b[2], b[3], b[1]);
	};
	var st  = function(i) {
		var b = /\$([0-9]+),\s*\$([0-9]+)/.exec(i);
		return encode(b[1], b[2], 0);
	};
	var s   = function(i) {
		var b = /\$([0-9]+)/.exec(i);
		return encode(b[1], 0, 0);
	};
	var d   = function(i) {
		var b = /\$([0-9]+)/.exec(i);
		return encode(0, 0, b[1]);
	};

	var instructions = [
	{	// .word isn't a real instruction
			opcode:		".word",
				argformat:	i,
	} ,
	{
			opcode:		"jr",
			lowbits:	0x08,
			argformat:	s,
			implfn:		function(cpu, s) {
				cpu.PC = cpu.u_reg(s);
				return "jr $" + s;
			}
	},
	{
			opcode:		"jalr",
			lowbits:	0x09,
			argformat:	s,
			implfn:		function(cpu, s) {
				cpu.reg[31] = cpu.PC;
				cpu.PC = cpu.u_reg(s);
				return "jalr $" + s;
			}
	},
	{
			opcode:		"mfhi",
			lowbits:	0x010,
			argformat:	d,
			implfn:		function(cpu, d) {
				cpu.reg[d] = cpu.hi;
				return "mfhi $" + d;
			}
	},
	{
			opcode:		"mflo",
			lowbits:	0x012,
			argformat:	d,
			implfn:		function(cpu, d) {
				cpu.reg[d] = cpu.lo;
				return "mflo $" + d;
			}
	},
	{
			opcode:		"lis",
			lowbits:	0x014,
			argformat:	d,
			implfn:		function(cpu, d) {
				cpu.reg[d] = cpu.tlbmem(cpu.PC);
				cpu.PC += 4; // skip data we just loaded
				return "lis $" + d; 
			}
	},
	{
			opcode:		"mult",
			lowbits:	0x018,
			argformat:	st,
			implfn:		function() {
				var rslt = cpu.s_reg(s) * cpu.s_reg(t);
				cpu.lo = rslt & 0x000000000FFFFFFFF;
				cpu.hi = rslt & 0x0FFFFFFFF00000000;
				return "mult $" + s + ", $" + t;
			}
	},
	{
			opcode:		"multu",
			lowbits:	0x019,
			argformat:	st,
			implfn:		function(cpu, s, t) {
				var rslt= cpu.u_reg(s) * cpu.u_reg(t);
				cpu.lo = rslt & 0x000000000FFFFFFFF;
				cpu.hi = rslt & 0x0FFFFFFFF00000000;
				return "multu $" + s + ", $" + t;
			}
	},
	{
			opcode:		"div",
			lowbits:	0x01A,
			argformat:	st,
			implfn:		function(cpu, s, t) {
				var n = cpu.s_reg(s);
				var d = cpu.s_reg(t);
				cpu.hi = n % d;
				cpu.lo = (n - cpu.hi ) / d;
				return "div $" + s + ", $" + t;
			}
	},
	{
			opcode:		"divu",
			lowbits:	0x01B,
			argformat:	st,
			implfn:		function(cpu, s, t) {
				var n = cpu.u_reg(s);
				var d = cpu.u_reg(t);
				cpu.hi = n % d;
				cpu.lo = (n - cpu.hi ) / d;
				return "divu $" + s + ", $" + t;
			}
	},
	{
			opcode:		"add",
			lowbits:	0x000000020,
			argformat:	dst,
			implfn:		function(cpu, d, s, t) {
				cpu.reg[d] = cpu.s_int(cpu.s_reg(s) + cpu.s_reg(t));
				return "add $" + d + ", $" + s + ", $" + t;
			}
	},
	{
			opcode:		"sub",
			lowbits:	0x000000022,
			argformat:	dst,
			implfn:		function(cpu, d, s, t) {
				cpu.reg[d] = cpu.s_int( cpu.s_reg(s) - cpu.s_reg(t));
				return "sub $" + d + ", $" + s + ", $" + t;
			}
	},
	{
			opcode:		"slt",
			lowbits:	0x00000002A,
			argformat:	dst,
			implfn:		function(cpu, d, s, t) {
				if(cpu.u_reg(s) < cpu.u_reg(t)) {
					cpu.reg[d] = 1;
				} else {
					cpu.reg[d] = 0;
				}
				return "sltu $" + d + ", $" + s + ", $" + t;
			}
	},
	{
			opcode:		"sltu",
			lowbits:	0x00000002B,
			argformat:	dst,
			implfn:		function(cpu, d, s, t) {
				if(cpu.u_reg(s) < cpu.u_reg(t)) {
					cpu.reg[d] = 1;
				} else {
					cpu.reg[d] = 0;
				}
				return "sltu $" + d + ", $" + s + ", $" + t;
			}
	},
	{
			opcode:		"beq",
			topbits:	0x05,
			argformat:	sti,
			implfn:		function(cpu, s, t, i) {
				if(cpu.s_reg(s) == cpu.s_reg(t)) {
					cpu.PC += i*4;
				}
				return "beq $" + t + ", $" + s + " " + i; 
			}
	},
	{
			opcode:		"bne",
			topbits:	0x05,
			argformat:	sti,
			implfn:		function(cpu, s, t, i) {
				if(cpu.s_reg(s) != cpu.s_reg(t)) {
					cpu.PC += i*4;
				}
				return "BNE $" + t + ", $" + s + " " + i;
			}
	},
	{
			opcode:		"lw",
			topbits:	0x23,
			argformat:	tis,
			implfn:		function(cpu, s, t, i) {
				cpu.reg[t] = cpu.mem[cpu.tlblookup(cpu.reg[s] + i)];
				return "lw $" + t + ", " + i + "($" + s + ")";
			}
	},
	{
			opcode:		"sw",
			topbits:	0x02B,
			argformat:	tis,
			implfn:		function(cpu, s, t, i) {
				cpu.mem[cpu.tlblookup(cpu.reg[s] + i)] = cpu.reg[t];
				return "sw $" + t + ", " + i + "($" + s + ")";
			}
	},
	]

	this.opcodes = {};
	this.lowbits = {};
	this.topbits = {};

	for (x in instructions) {
		var i = instructions[x]
			this.opcodes[i.opcode] = i;
		if(i.topbits) {
			this.topbits[i.topbits] = i.implfn;
		}
		if(i.lowbits) {
			this.lowbits[i.lowbits] = i.implfn;
		}
	}

}
