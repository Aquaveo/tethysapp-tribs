from tethysapp.tribs.consumers.exc import LinkedDatasetError


def test_LinkedDatasetError(new_dataset):
    exc = LinkedDatasetError('message', new_dataset)
    assert exc.message == 'message'
    assert exc.dataset == new_dataset
