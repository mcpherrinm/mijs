// An MMU should be a class that has minimally a "read" and "write"
// single word operations.
// Probably some sort of mmap and tlb ops too

function MMU() {
	// Array of words
	this.physical = new Array();
	// Memory size in bytes
	this.physicalsize = 1024;
	for(var i=0;i<(this.physicalsize/4);i++) this.physical[i] = 0;
    this.tlblookup = function(addr) {
		if(addr % 4 != 0) {
				return cpu.mipsexception("UNALIGNED ACCESS");
		}
		if(addr > this.physicalsize) {
				return cpu.mipsexception("YOU SHALL NOT PASS (the end of memory)");
		}
        return addr / 4;
    } 

	this.read = function(addr) {
		return this.physical[this.tlblookup(addr)];
	}

	this.write = function(addr, data) {
		this.physical[this.tlblookup(addr)] = cpu.u_int(data);
	}

	this.load = function(arr, addr) {
			if(addr % 4 != 0) {
					return cpu.mipsexception("UNALIGNED LOAD");
			}
			var offset = parseInt(addr) / 4;
			for(key in arr) {
					this.physical[parseInt(key)+offset] = arr[key]
			}
	}

}
