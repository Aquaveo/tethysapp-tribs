class LinkedDatasetError(Exception):
    def __init__(self, message, dataset):
        super().__init__(message, dataset)
        self.message = message
        self.dataset = dataset

    def __str__(self):
        return repr(self.message)
