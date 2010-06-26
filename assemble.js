/*
.word i
add $d, $s, $t
sub $d, $s, $t
mult $s, $t
multu $s, $t
div $s, $t
divu $s, $t
mfhi $d
mflo $d
lis $d
lw $t, i($s)
sw $t
slt $d, $s, $t
sltu $d, $s, $t
beq $s, $t, i
bne $s, $t, i
jr $s
jalr $s
   */


assemble = function(asm) {
		// Write this! :p
		var arry = asm.split("\n");
		var rs = new Array();
		for( x in arry ) {
				rs[x] = parseInt(arry[x].replace(/\s*/g, ''));
				if(isNaN(rs[x])) {
						rs[x] = 0;
				}
		}
		return rs;
}
