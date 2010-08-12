		var reggae = function(r1, r2, r3) {
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
			return reggae(b[1], b[3], 0) & parseInt(b[2]);
		};
		var sti = function(i) {
			var b = /\$([0-9]+)\s*,\s*\$([0-9]+)\s*,\s*(\S)/.exec(i);
			return reggae(b[1], b[2], 0) & parseInt(b[3]);
		}
		var dst = function(i) {
			var b = /\$([0-9]+),\s*\$([0-9]+),\s*\$([0-9]+)/.exec(i);
			return reggae(b[2], b[3], b[1]);
		};
		var st  = function(i) {
			var b = /\$([0-9]+),\s*\$([0-9]+)/.exec(i);
			return reggae(b[1], b[2], 0);
		};
		var s   = function(i) {
			var b = /\$([0-9]+)/.exec(i);
			return reggae(b[1], 0, 0);
		};
		var d   = function(i) {
			var b = /\$([0-9]+)/.exec(i);
			return reggae(0, 0, b[1]);
		};
var instructions = [
{	// .word isn't a real instruction
	opcode:		".word",
	wordmask:	0x000000000,
	argformat:	i,
	implfn:		function(i) { }
} ,
{
	opcode:		"jr",
	wordmask:	0x000000008,
	argformat:	s,
	implfn:		function(cpu, s) {
		cpu.PC = cpu.u_reg(s);
		return "jr $" + s;
	}
},
{
	opcode:		"jalr",
	wordmask:	0x000000009,
	argformat:	s,
	implfn:		function(cpu, s) {
		cpu.reg[31] = cpu.PC;
		cpu.PC = cpu.u_reg(s);
		return "jalr $" + s;
	}
},
{
	opcode:		"mfhi",
	wordmask:	0x000000010,
	argformat:	d,
	implfn:		function(cpu, d) {
   		cpu.reg[d] = cpu.hi;
   		return "mfhi $" + d;
	}
},
{
	opcode:		"mflo",
	wordmask:	0x000000012,
	argformat:	d,
	implfn:		function(cpu, d) {
   		cpu.reg[d] = cpu.lo;
   		return "mflo $" + d;
	}
},
{
	opcode:		"lis",
	wordmask:	0x000000014,
	argformat:	d,
	implfn:		function(cpu, d) {
		cpu.reg[d] = cpu.tlbmem(cpu.PC);
		cpu.PC += 4; // skip data we just loaded
		return "lis $" + d; 
	}
},
{
	opcode:		"mult",
	wordmask:	0x000000018,
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
	wordmask:	0x000000019,
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
	wordmask:	0x00000001A,
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
	wordmask:	0x00000001B,
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
	wordmask:	0x000000020,
	argformat:	dst,
	implfn:		function(cpu, d, s, t) {
		cpu.reg[d] = cpu.s_int(cpu.s_reg(s) + cpu.s_reg(t));
		return "add $" + d + ", $" + s + ", $" + t;
	}
},
{
	opcode:		"sub",
	wordmask:	0x000000022,
	argformat:	dst,
	implfn:		function(cpu, d, s, t) {
		cpu.reg[d] = cpu.s_int( cpu.s_reg(s) - cpu.s_reg(t));
		return "sub $" + d + ", $" + s + ", $" + t;
	}
},
{
	opcode:		"slt",
	wordmask:	0x00000002A,
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
	wordmask:	0x00000002B,
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
	wordmask:	0x010000000,
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
	wordmask:	0x014000000,
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
	wordmask:	0x08C000000,
	argformat:	tis,
	implfn:		function(cpu, s, t, i) {
		cpu.reg[t] = cpu.mem[cpu.tlblookup(cpu.reg[s] + i)];
		return "lw $" + t + ", " + i + "($" + s + ")";
	}
},
{
	opcode:		"sw",
	wordmask:	0x0AC000000,
	argformat:	tis,
	implfn:		function(cpu, s, t, i) {
		cpu.mem[cpu.tlblookup(cpu.reg[s] + i)] = cpu.reg[t];
		return "sw $" + t + ", " + i + "($" + s + ")";
	}
},
]

opcodes = new Array();
wordmask = new Array();
// Turn that into maps for constant time lookups
// At least I think; I assume JS stores stuff sanely.
for (x in instructions) {
	opcodes[instructions[x].opcode] = instructions[x];
}

for (x in instructions) {
	wordmask[instructions[x].wordmask] = instructions[x];
}
