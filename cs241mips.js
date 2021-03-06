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

	var arg_s = function(op) {
		return (op & 0x003E00000) >> 21;
	}
	var arg_t = function(op) {
		return (op & 0x0001F0000) >> 16;
	}
	var arg_d = function(op) {
		return (op & 0x00000F800) >> 11;
	}
	var arg_i = function(op) {
		return (op & 0x00000FFFF);
	}

	var i   = function(i) {
		return parseInt(/\.word\s+(\S+)/.exec(i)[1]); 
	};
	tis = function(i) {
		var b = /\$([0-9]+),\s*(-?[0-9]+)\(\$([0-9]+)\)/.exec(i);
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
				implfn: function() {alert("fuck");}
	} ,
	{
			opcode:		"jr",
			wordmask:	0x08,
			argformat:	s,
			implfn:		function(cpu, op) {
                                var s = arg_s(op);
				cpu.PC = cpu.u_reg(arg_s(op));
				return "jr $" + s;
			}
	},
	{
			opcode:		"jalr",
			wordmask:	0x09,
			argformat:	s,
			implfn:		function(cpu, op) {
                                var s = arg_s(op);
				cpu.reg[31] = cpu.PC;
				cpu.PC = cpu.u_reg(arg_s(op));
				return "jalr $" + s;
			}
	},
	{
			opcode:		"mfhi",
			wordmask:	0x010,
			argformat:	d,
			implfn:		function(cpu, op) {
				cpu.reg[arg_d(op)] = cpu.hi;
				return "mfhi $" + arg_d(op);
			}
	},
	{
			opcode:		"mflo",
			wordmask:	0x012,
			argformat:	d,
			implfn:		function(cpu, op) {
				cpu.reg[arg_d(op)] = cpu.lo;
				return "mflo $" + d;
			}
	},
	{
			opcode:		"lis",
			wordmask:	0x014,
			argformat:	d,
			implfn:		function(cpu, op) {
				var d = arg_d(op);
                                console.log(" lis arg" + d)
				cpu.reg[d] = cpu.mmu.read(cpu.PC);
                                console.log("reg is" + cpu.reg[d])
				cpu.PC += 4; // skip data we just loaded
				return "lis $" + d; 
			}
	},
	{
			opcode:		"mult",
			wordmask:	0x018,
			argformat:	st,
			implfn:		function(cpu, op) {
				var s = arg_s(op);
				var t = arg_t(op);
				var rslt = cpu.s_reg(s) * cpu.s_reg(t);
				cpu.lo = rslt & 0x000000000FFFFFFFF;
				cpu.hi = rslt & 0x0FFFFFFFF00000000;
				return "mult $" + s + ", $" + t;
			}
	},
	{
			opcode:		"multu",
			wordmask:	0x019,
			argformat:	st,
			implfn:		function(cpu, op) {
				var s = arg_s(op);
				var t = arg_t(op);
				var rslt= cpu.u_reg(s) * cpu.u_reg(t);
				cpu.lo = rslt & 0x000000000FFFFFFFF;
				cpu.hi = rslt & 0x0FFFFFFFF00000000;
				return "multu $" + s + ", $" + t;
			}
	},
	{
			opcode:		"div",
			wordmask:	0x01A,
			argformat:	st,
			implfn:		function(cpu, op) {
				var s = arg_s(op)
				var t = arg_t(op)
				var n = cpu.s_reg(s);
				var d = cpu.s_reg(t);
				cpu.hi = n % d;
				cpu.lo = (n - cpu.hi ) / d;
				return "div $" + s + ", $" + t;
			}
	},
	{
			opcode:		"divu",
			wordmask:	0x01B,
			argformat:	st,
			implfn:		function(cpu, op) {
				var s = arg_s(op)
				var t = arg_t(op)
				var n = cpu.u_reg(s);
				var d = cpu.u_reg(t);
				cpu.hi = n % d;
				cpu.lo = (n - cpu.hi ) / d;
				return "divu $" + s + ", $" + t;
			}
	},
	{
			opcode:		"add",
			wordmask:	0x000000020,
			argformat:	dst,
			implfn:		function(cpu, op) {
				var d = arg_d(op)
				var s = arg_s(op)
				var t = arg_t(op)
				cpu.reg[d] = cpu.s_int(cpu.s_reg(s) + cpu.s_reg(t));
				return "add $" + d + ", $" + s + ", $" + t;
			}
	},
	{
			opcode:		"sub",
			wordmask:	0x000000022,
			argformat:	dst,
			implfn:		function(cpu, op) {
				var d = arg_d(op)
				var s = arg_s(op)
				var t = arg_t(op)
				cpu.reg[d] = cpu.s_int( cpu.s_reg(s) - cpu.s_reg(t));
				return "sub $" + d + ", $" + s + ", $" + t;
			}
	},
	{
			opcode:		"slt",
			wordmask:	0x00000002A,
			argformat:	dst,
			implfn:		function(cpu, op) {
				var d = arg_d(op)
				var s = arg_s(op)
				var t = arg_t(op)
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
			wordmask:	0x00000002B,
			argformat:	dst,
			implfn:		function(cpu, op) {
				var d = arg_d(op)
				var s = arg_s(op)
				var t = arg_t(op)
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
			implfn:		function(cpu, op) {
				var s = arg_s(op)
				var t = arg_t(op)
				var i = arg_i(op)
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
			implfn:		function(cpu, op) {
				var s = arg_s(op)
				var t = arg_t(op)
				var i = arg_i(op)
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
			implfn:		function(cpu, op) {
				var s = arg_s(op)
				var t = arg_t(op)
				var i = arg_i(op)
				cpu.reg[t] = cpu.mmu.read(cpu.reg[s] + i);
				return "lw $" + t + ", " + i + "($" + s + ")";
			}
	},
	{
			opcode:		"sw",
			topbits:	0x02B,
			argformat:	tis,
			implfn:		function(cpu, op) {
				var s = arg_s(op)
				var t = arg_t(op)
				var i = arg_i(op)
				cpu.mmu.write(cpu.reg[s]+1, cpu.reg[t]);
				return "sw $" + t + ", " + i + "($" + s + ")";
			}
	},
	]

	this.opcodes = {};
	this.lowbits = {};
	this.topbits = {};

	for (x in instructions) {
		var i = instructions[x]
		if(i.topbits) {
			this.topbits[i.topbits] = i.implfn;
			i.wordmask = i.topbits << 26;
		} else if(i.wordmask) {
			this.lowbits[i.wordmask] = i.implfn;
		}
		this.opcodes[i.opcode] = i;
	}

}
