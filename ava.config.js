export default {
    files: [
        'src/**/*.spec.ts'
    ],
    sources: [
        'src/**/*.ts'
    ],
    compileEnhancements: false,
    extensions: [
        'ts',
        'spec.ts'
    ],
    require: [
        'ts-node/register'
    ]
}
