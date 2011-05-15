encodeInstr = function(instr){
		// Remove leading whitespace, and trailing comments
		instr = instr.replace(/^\s+/,'').split(/;/,1)[0];
		//opcode is the first thing on the line
		var opcode = instr.split(/\s+/, 1);
		var line   = CS241MIPS.opcodes[opcode];
		if(typeof(line) == "undefined") return 0;
		return line.wordmask | line.argformat(instr);
}

assemble = function(asm) {
		var arry = asm.split("\n");
		var rs = new Array();
		for( x in arry ) {
				// If there's non-whitespace on a line
				if(/\S/.test(arry[x])) {
						var enc = encodeInstr(arry[x]);
						if(!isNaN(enc)) {
							rs.push(enc)
						}
				}
		}
		return rs;
}
