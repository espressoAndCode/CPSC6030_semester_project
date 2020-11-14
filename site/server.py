from livereload import Server

def live():
    """Run livereload server"""
    server = Server()
    server.watch("*")  # pages this dir
    server.serve(port=5500)


if __name__ == "__main__":
    live()