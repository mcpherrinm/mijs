/*
.word i
add  $d, $s, $t
sub  $d, $s, $t
slt  $d, $s, $t
sltu $d, $s, $t
mult  $s, $t
multu $s, $t
div   $s, $t
divu  $s, $t
beq $s, $t, i
bne $s, $t, i
lw $t, i($s)
sw $t, i($s)
mfhi $d
mflo $d
lis $d
jr $s
jalr $s

*/


encodeInstr = function(instr){
		// Remove leading whitespace, and trailing comments
		instr = instr.replace(/^\s+/,'').split(/;/,1)[0];
		//opcode is the first thing on the line
		var opcode = instr.split(/\s+/, 1);
		var line   = cs241mips[opcode];
		if(typeof(line) == "undefined") return 0;
		return line[0] | line[1](instr);
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
