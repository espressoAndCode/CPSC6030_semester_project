from livereload import Server

def live():
    """Run livereload server"""
    server = Server()
    server.watch("*")  # pages this dir
    server.serve(port=5501)


if __name__ == "__main__":
    live()