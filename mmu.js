// An MMU should be a class that has minimally a "read" and "write"
// single word operations.
// Probably some sort of mmap and tlb ops too

// In cs241:
//writing 0xFFFF000C puts to stdout
//reading 0xFFFF0004 grabs a byte from stdin

function MMU() {
	// Memory size in bytes
	this.physicalsize = 1024;
	this.physical = new ArrayBuffer(this.physicalsize);
	this.words = new Uint32Array(this.physical);
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
		return this.words[this.tlblookup(addr)];
	}

	this.write = function(addr, data) {
		this.words[this.tlblookup(addr)] = cpu.u_int(data);
	}

	this.load = function(arr, addr) {
			if(addr % 4 != 0) {
					return cpu.mipsexception("UNALIGNED LOAD");
			}
			var offset = parseInt(addr) / 4;
			for(key in arr) {
					this.words[parseInt(key)+offset] = arr[key]
			}
	}

}
